"use client";

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { MailService } from '../mail/mail.service';
import { CampaignService } from './services/campaign.service';
import { TreasuryService } from './services/treasury.service';
import { PaymentService } from './services/payment.service';
import { ReportService } from './services/report.service';
import { Response } from 'express'; // Required for Reports

@Injectable()
export class FinanceService {
    private readonly logger = new Logger(FinanceService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private campaignService: CampaignService,
        private treasuryService: TreasuryService,
        private paymentService: PaymentService,
        private reportService: ReportService,
    ) { }

    // ── DELEGATIONS ──
    async createCampaign(associationId: string, dto: CreateCampaignDto) {
        return this.campaignService.createCampaign(associationId, dto);
    }
    async findAllCampaigns(associationId: string) {
        return this.campaignService.findAllCampaigns(associationId);
    }
    async findOneCampaign(associationId: string, campaignId: string) {
        return this.campaignService.findOneCampaign(associationId, campaignId);
    }
    async getTreasuryAccounts(associationId: string) {
        return this.treasuryService.getAccounts(associationId);
    }
    async createTreasuryAccount(associationId: string, name: string, type: string, initialBalance = 0) {
        return this.treasuryService.createAccount(associationId, name, type, initialBalance);
    }
    async createExpense(associationId: string, dto: CreateExpenseDto & { treasuryAccountId?: string }) {
        return this.treasuryService.createExpense(associationId, dto);
    }
    async getLedger(associationId: string) {
        return this.treasuryService.getLedger(associationId);
    }
    async getPaymentConfig(associationId: string) {
        return this.paymentService.getPaymentConfig(associationId);
    }
    async updatePaymentConfig(associationId: string, dto: any) {
        return this.paymentService.updatePaymentConfig(associationId, dto);
    }
    async triggerCron() {
        this.logger.log("Manual trigger of Cron Jobs...");
        await this.checkRecurringCampaigns();
        await this.checkOverdueFees();
        return { success: true, message: "Cron jobs triggered" };
    }
    async checkRecurringCampaigns() {
        return this.campaignService.checkRecurringCampaigns();
    }
    async checkOverdueFees() {
        return this.campaignService.checkOverdueFees();
    }

    // ── REPORTING DELEGATIONS (NEW) ──
    async downloadReceipt(feeId: string, res: Response) {
        return this.reportService.generateReceiptPdf(feeId, res);
    }

    async downloadLedgerCsv(associationId: string, res: Response) {
        return this.reportService.generateLedgerCsv(associationId, res);
    }

    // ── STATS & MEMBER SUMMARY ──
    async getGlobalStats(associationId: string) {
        const campaigns = await this.prisma.campaign.findMany({ where: { associationId } });
        if (campaigns.length === 0) return { totalExpected: 0, totalCollected: 0, remaining: 0 };

        const campaignIds = campaigns.map(c => c.id);
        const feeStats = await this.prisma.fee.groupBy({
            by: ['campaignId', 'status'],
            where: { campaignId: { in: campaignIds } },
            _count: { _all: true },
        });

        let totalExpected = 0;
        let totalCollected = 0;
        const campaignMap = new Map(campaigns.map(c => [c.id, c.amount]));

        for (const stat of feeStats) {
            const amount = campaignMap.get(stat.campaignId) || 0;
            const count = stat._count._all;
            totalExpected += amount * count;
            if (stat.status === 'PAID') totalCollected += amount * count;
        }

        return {
            totalExpected,
            totalCollected,
            remaining: totalExpected - totalCollected,
        };
    }

    async getMemberFinanceSummary(associationId: string) {
        const campaigns = await this.prisma.campaign.findMany({ where: { associationId }, select: { id: true } });
        const campaignIds = campaigns.map(c => c.id);
        if (campaignIds.length === 0) return {};

        const stats = await this.prisma.fee.groupBy({
            by: ['userId', 'status'],
            where: { campaignId: { in: campaignIds }, userId: { not: null } },
            _count: { _all: true }
        });

        const result: Record<string, { total: number; paid: number; pending: number; overdue: number }> = {};
        for (const s of stats) {
            const userId = s.userId!;
            if (!result[userId]) result[userId] = { total: 0, paid: 0, pending: 0, overdue: 0 };
            const count = s._count._all;
            result[userId].total += count;
            if (s.status === 'PAID') result[userId].paid += count;
            else if (s.status === 'OVERDUE') result[userId].overdue += count;
            else result[userId].pending += count;
        }
        return result;
    }

    async findFeesForUser(associationId: string, userId: string) {
        const fees = await this.prisma.fee.findMany({
            where: { userId },
            include: { campaign: { select: { associationId: true, name: true, amount: true, due_date: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return fees
            .filter((f) => f.campaign.associationId === associationId)
            .map((f) => ({
                id: f.id,
                label: f.campaign.name,
                amount: f.campaign.amount,
                status: f.status,
                dueDate: f.campaign.due_date,
                paidAt: f.status === 'PAID' ? f.updatedAt : null,
            }));
    }

    // ── PAY FEE (MANUAL) ──
    async payFee(associationId: string, feeId: string, paymentMethod?: string, treasuryAccountId?: string) {
        const fee = await this.prisma.fee.findUnique({
            where: { id: feeId },
            include: { campaign: true }
        });

        if (!fee || fee.campaign.associationId !== associationId) throw new NotFoundException('Cotisation introuvable');
        if (fee.status === 'PAID') throw new BadRequestException('Déjà payée');

        const result = await this.prisma.$transaction(async (tx) => {
            let accountId = treasuryAccountId;
            if (!accountId) {
                const acc = await tx.treasuryAccount.findFirst({ where: { associationId, type: 'BANK' } })
                    || await tx.treasuryAccount.findFirst({ where: { associationId } });
                accountId = acc?.id;
            }

            const transaction = await tx.transaction.create({
                data: {
                    associationId,
                    amount: fee.campaign.amount,
                    type: 'INCOME',
                    category: 'COTISATION',
                    paymentMethod: paymentMethod || 'CASH',
                    description: `Paiement — ${fee.campaign.name}`,
                    treasuryAccountId: accountId,
                }
            });

            if (accountId) {
                await tx.treasuryAccount.update({
                    where: { id: accountId },
                    data: { balance: { increment: fee.campaign.amount } }
                });
            }

            await tx.fee.update({
                where: { id: feeId },
                data: { status: 'PAID', transactionId: transaction.id }
            });
            return transaction;
        });

        return { success: true, feeId, transactionId: result.id };
    }

    // ── PAY FEE WITH WALLET ──
    async payFeeWithWallet(userId: string, feeId: string) {
        // ... (Logic kept same as previous step)
        const fee = await this.prisma.fee.findUnique({ where: { id: feeId }, include: { campaign: true } });
        if (!fee || fee.userId !== userId) throw new BadRequestException('Action non autorisée');
        if (fee.status === 'PAID') throw new BadRequestException('Déjà payée');

        const amount = fee.campaign.amount;

        const result = await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet || wallet.balance < amount) throw new BadRequestException('Solde insuffisant');

            await tx.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
            await tx.walletTransaction.create({
                data: { walletId: wallet.id, amount: -amount, type: 'PAYMENT', status: 'COMPLETED', description: `Paiement: ${fee.campaign.name}`, feeId: fee.id }
            });

            let treasury = await tx.treasuryAccount.findFirst({ where: { associationId: fee.campaign.associationId, type: 'CASH' } });
            if (!treasury) {
                treasury = await tx.treasuryAccount.create({ data: { associationId: fee.campaign.associationId, name: 'Caisse Principale', type: 'CASH', balance: 0 } });
            }

            const assocTx = await tx.transaction.create({
                data: {
                    associationId: fee.campaign.associationId, amount, type: 'INCOME', category: 'COTISATION', paymentMethod: 'WALLET', description: `Wallet — ${fee.campaign.name}`, treasuryAccountId: treasury.id
                }
            });

            await tx.treasuryAccount.update({ where: { id: treasury.id }, data: { balance: { increment: amount } } });
            await tx.fee.update({ where: { id: fee.id }, data: { status: 'PAID', transactionId: assocTx.id } });

            return { success: true, transactionId: assocTx.id, newBalance: wallet.balance - amount };
        });

        if (userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user?.email) {
                this.mailService.sendPaymentReceipt({ to: user.email, memberName: user.firstName, title: fee.campaign.name, amount, transactionId: result.transactionId, date: new Date() }).catch(e => this.logger.error("Failed receipt", e));
            }
        }
        return result;
    }

    // ── ASYNC PAYMENT FLOW (INITIATE) ──
    async payFeeOnline(userId: string, feeId: string, dto: { provider: string; phoneNumber?: string }) {
        const fee = await this.prisma.fee.findUnique({ where: { id: feeId }, include: { campaign: true, user: true } });
        if (!fee || fee.userId !== userId) throw new BadRequestException('Action non autorisée');
        if (fee.status === 'PAID') throw new BadRequestException('Déjà payée');
        if (fee.status === 'PROCESSING') throw new BadRequestException('Paiement déjà en cours de traitement. Vérifiez vos SMS/Emails ou attendez quelques instants.');

        // 1. Initiate Gateway Payment
        const paymentReference = await this.paymentService.processPayment(
            fee.campaign.associationId,
            fee.campaign.amount,
            `Fee: ${fee.campaign.name}`,
            dto.provider,
            dto.phoneNumber
        );

        // 2. Mark as PROCESSING (Async Flow)
        // ...
        await this.prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'PROCESSING',
                // Store reference somewhere if needed
            }
        });

        // 3. (Mocking Webhook/Callback Delay - Auto Confirm for Demo)
        const result = await this.prisma.$transaction(async (tx) => {
            let treasury = await tx.treasuryAccount.findFirst({ where: { associationId: fee.campaign.associationId, type: 'BANK' } })
                || await tx.treasuryAccount.findFirst({ where: { associationId: fee.campaign.associationId } });

            if (!treasury) {
                treasury = await tx.treasuryAccount.create({ data: { associationId: fee.campaign.associationId, name: "Compte (Défaut)", type: "BANK", balance: 0 } });
            }

            const txRecord = await tx.transaction.create({
                data: {
                    associationId: fee.campaign.associationId,
                    amount: fee.campaign.amount,
                    type: 'INCOME',
                    category: 'COTISATION',
                    paymentMethod: dto.provider,
                    description: `Online (${dto.provider}) Ref: ${paymentReference}`,
                    treasuryAccountId: treasury.id,
                }
            });

            await tx.treasuryAccount.update({ where: { id: treasury.id }, data: { balance: { increment: fee.campaign.amount } } });

            // Finalize Status
            await tx.fee.update({ where: { id: feeId }, data: { status: 'PAID', transactionId: txRecord.id } });

            return { success: true, transactionId: txRecord.id };
        });

        if (fee.user?.email) {
            this.mailService.sendPaymentReceipt({
                to: fee.user.email,
                memberName: fee.user.firstName,
                title: fee.campaign.name,
                amount: fee.campaign.amount,
                transactionId: result.transactionId,
                date: new Date()
            }).catch(e => this.logger.error("Failed receipt", e));
        }

        return result;
    }

    // ── WEBHOOK HANDLER (NEW) ──
    async handlePaymentWebhook(provider: string, payload: any) {
        this.logger.log(`Received Webhook from ${provider}`, payload);
        return { received: true };
    }
}
