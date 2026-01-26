import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async getStats(associationId: string) {
        const fees = await this.prisma.fee.findMany({
            where: {
                campaign: {
                    associationId,
                },
            },
            include: {
                campaign: true,
            },
        });

        const totalCollectable = fees.reduce((acc, fee) => acc + fee.campaign.amount, 0);
        const totalReceived = fees
            .filter((fee) => fee.status === 'PAID')
            .reduce((acc, fee) => acc + fee.campaign.amount, 0);
        const remaining = totalCollectable - totalReceived;

        return {
            totalCollectable,
            totalReceived,
            remaining,
        };
    }

    async getCampaigns(associationId: string) {
        return this.prisma.campaign.findMany({
            where: { associationId },
            include: {
                _count: {
                    select: { fees: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createCampaign(associationId: string, dto: CreateCampaignDto) {
        // 1. Start a transaction
        return this.prisma.$transaction(async (tx) => {
            // 2. Create the campaign
            const campaign = await tx.campaign.create({
                data: {
                    name: dto.name,
                    amount: dto.amount,
                    due_date: new Date(dto.dueDate),
                    associationId,
                },
            });

            // 3. Find all active members in the association
            const activeUsers = await tx.user.findMany({
                where: {
                    associationId,
                    status: 'ACTIVE',
                },
            });

            // 4. Batch create fees for each active user
            if (activeUsers.length > 0) {
                await tx.fee.createMany({
                    data: activeUsers.map((user) => ({
                        userId: user.id,
                        campaignId: campaign.id,
                        status: 'PENDING',
                    })),
                });
            }

            return campaign;
        });
    }

    async getCampaignDetails(id: string) {
        return this.prisma.campaign.findUnique({
            where: { id },
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
                            },
                        },
                    },
                    orderBy: {
                        user: {
                            lastName: 'asc',
                        },
                    },
                },
            },
        });
    }

    async markFeeAsPaid(feeId: string) {
        return this.prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'PAID',
            },
            include: {
                user: true,
                campaign: true,
            },
        });
    }
}
