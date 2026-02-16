import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // ── Helper: recursively collect all descendant association IDs ──
    private async getAllDescendantIds(parentId: string): Promise<string[]> {
        const children = await this.prisma.association.findMany({
            where: { parentId },
            select: { id: true },
        });
        const ids: string[] = [];
        for (const child of children) {
            ids.push(child.id);
            const grandchildren = await this.getAllDescendantIds(child.id);
            ids.push(...grandchildren);
        }
        return ids;
    }

    // ── CREATE CAMPAIGN + AUTO-GENERATE FEES ──
    async createCampaign(associationId: string, dto: CreateCampaignDto) {
        const scope = dto.scope || 'LOCAL';

        // 1. Create the campaign
        const campaign = await this.prisma.campaign.create({
            data: {
                associationId,
                name: dto.name,
                amount: dto.amount,
                description: dto.description || null,
                due_date: new Date(dto.due_date),
                scope,
            },
        });

        let feesGenerated = 0;

        if (scope === 'LOCAL') {
            // Fetch all ACTIVE users of THIS association only
            const activeUsers = await this.prisma.user.findMany({
                where: { associationId, status: 'ACTIVE' },
                select: { id: true },
            });
            if (activeUsers.length > 0) {
                await this.prisma.fee.createMany({
                    data: activeUsers.map((u) => ({
                        userId: u.id,
                        campaignId: campaign.id,
                        status: 'PENDING',
                    })),
                });
            }
            feesGenerated = activeUsers.length;

        } else if (scope === 'NETWORK_MEMBERS') {
            // Fetch ALL descendants + self
            const descendantIds = await this.getAllDescendantIds(associationId);
            const allAssocIds = [associationId, ...descendantIds];

            const activeUsers = await this.prisma.user.findMany({
                where: {
                    associationId: { in: allAssocIds },
                    status: 'ACTIVE',
                },
                select: { id: true },
            });
            if (activeUsers.length > 0) {
                await this.prisma.fee.createMany({
                    data: activeUsers.map((u) => ({
                        userId: u.id,
                        campaignId: campaign.id,
                        status: 'PENDING',
                    })),
                });
            }
            feesGenerated = activeUsers.length;

        } else if (scope === 'NETWORK_BRANCHES') {
            // Fetch direct child associations
            const children = await this.prisma.association.findMany({
                where: { parentId: associationId },
                select: { id: true },
            });
            if (children.length > 0) {
                await this.prisma.fee.createMany({
                    data: children.map((c) => ({
                        targetAssociationId: c.id,
                        campaignId: campaign.id,
                        status: 'PENDING',
                    })),
                });
            }
            feesGenerated = children.length;
        }

        return {
            ...campaign,
            feesGenerated,
        };
    }

    // ── LIST ALL CAMPAIGNS WITH STATS ──
    async findAllCampaigns(associationId: string) {
        const campaigns = await this.prisma.campaign.findMany({
            where: { associationId },
            orderBy: { createdAt: 'desc' },
            include: {
                fees: {
                    select: { status: true },
                },
            },
        });

        return campaigns.map((c) => {
            const totalFees = c.fees.length;
            const paidFees = c.fees.filter((f) => f.status === 'PAID').length;
            const totalExpected = totalFees * c.amount;
            const totalCollected = paidFees * c.amount;

            return {
                id: c.id,
                name: c.name,
                description: c.description,
                amount: c.amount,
                due_date: c.due_date,
                scope: c.scope,
                createdAt: c.createdAt,
                totalMembers: totalFees,
                paidMembers: paidFees,
                totalExpected,
                totalCollected,
                progress: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0,
            };
        });
    }

    // ── CAMPAIGN DETAIL WITH ALL FEES & MEMBER/BRANCH INFO ──
    async findOneCampaign(associationId: string, campaignId: string) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, associationId },
            include: {
                fees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                status: true,
                                association: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                        targetAssociation: {
                            select: {
                                id: true,
                                name: true,
                                address_city: true,
                                networkLevel: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!campaign) {
            throw new NotFoundException('Campagne non trouvée.');
        }

        const totalFees = campaign.fees.length;
        const paidFees = campaign.fees.filter((f) => f.status === 'PAID').length;
        const totalExpected = totalFees * campaign.amount;
        const totalCollected = paidFees * campaign.amount;

        return {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            amount: campaign.amount,
            due_date: campaign.due_date,
            scope: campaign.scope,
            createdAt: campaign.createdAt,
            totalMembers: totalFees,
            paidMembers: paidFees,
            totalExpected,
            totalCollected,
            progress: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0,
            fees: campaign.fees.map((f) => ({
                id: f.id,
                status: f.status,
                userId: f.userId,
                user: f.user,
                targetAssociationId: f.targetAssociationId,
                targetAssociation: f.targetAssociation,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
            })),
        };
    }

    // ── PAY A FEE (MARK AS PAID + CREATE TRANSACTION) ──
    async payFee(associationId: string, feeId: string) {
        // 1. Find the fee and ensure it belongs to this association's campaign
        const fee = await this.prisma.fee.findFirst({
            where: { id: feeId },
            include: {
                campaign: {
                    select: { associationId: true, name: true, amount: true },
                },
            },
        });

        if (!fee || fee.campaign.associationId !== associationId) {
            throw new NotFoundException('Cotisation non trouvée.');
        }

        if (fee.status === 'PAID') {
            throw new BadRequestException('Cette cotisation est déjà payée.');
        }

        // 2. Create transaction + update fee in a transaction
        const [transaction] = await this.prisma.$transaction([
            // Create the INCOME transaction
            this.prisma.transaction.create({
                data: {
                    associationId,
                    amount: fee.campaign.amount,
                    type: 'INCOME',
                    category: 'COTISATION',
                    paymentMethod: 'CASH',
                    description: `Paiement — ${fee.campaign.name}`,
                },
            }),
            // Update the fee to PAID
            this.prisma.fee.update({
                where: { id: feeId },
                data: { status: 'PAID' },
            }),
        ]);

        // 3. Link the transaction to the fee
        await this.prisma.fee.update({
            where: { id: feeId },
            data: { transactionId: transaction.id },
        });

        return { success: true, feeId, transactionId: transaction.id };
    }

    // ── GLOBAL FINANCE STATS ──
    async getGlobalStats(associationId: string) {
        const campaigns = await this.prisma.campaign.findMany({
            where: { associationId },
            include: {
                fees: { select: { status: true } },
            },
        });

        let totalExpected = 0;
        let totalCollected = 0;

        for (const c of campaigns) {
            const total = c.fees.length * c.amount;
            const paid = c.fees.filter((f) => f.status === 'PAID').length * c.amount;
            totalExpected += total;
            totalCollected += paid;
        }

        return {
            totalExpected,
            totalCollected,
            remaining: totalExpected - totalCollected,
        };
    }

    // ── CREATE EXPENSE TRANSACTION ──
    async createExpense(associationId: string, dto: CreateExpenseDto) {
        const transaction = await this.prisma.transaction.create({
            data: {
                associationId,
                amount: dto.amount,
                type: 'EXPENSE',
                category: dto.category || 'AUTRE',
                paymentMethod: dto.paymentMethod || 'CASH',
                date: dto.date ? new Date(dto.date) : new Date(),
                description: dto.description || null,
            },
        });
        return transaction;
    }

    // ── GET LEDGER (ALL TRANSACTIONS + BALANCE) ──
    async getLedger(associationId: string) {
        const transactions = await this.prisma.transaction.findMany({
            where: { associationId },
            orderBy: { date: 'desc' },
        });

        let totalIncome = 0;
        let totalExpense = 0;

        for (const t of transactions) {
            if (t.type === 'INCOME') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        }

        return {
            currentBalance: totalIncome - totalExpense,
            totalIncome,
            totalExpense,
            transactions: transactions.map((t) => ({
                id: t.id,
                date: t.date,
                type: t.type,
                category: t.category,
                description: t.description,
                amount: t.amount,
                paymentMethod: t.paymentMethod,
                createdAt: t.createdAt,
            })),
        };
    }
}
