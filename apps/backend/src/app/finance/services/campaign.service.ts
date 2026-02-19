"use client";

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { Campaign } from '@prisma/client';
import { MailService } from '../../mail/mail.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    // ── Helper: recursively collect descendant IDs ──
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

    // ── HELPER: Next Run Date ──
    private calculateNextRun(date: Date, frequency: string): Date | null {
        const nextDate = new Date(date);
        switch (frequency) {
            case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'QUARTERLY':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'YEARLY':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                return null;
        }
        return nextDate;
    }

    // ── HELPER: Generate Fees ──
    private async generateFeesForCampaign(campaign: Campaign) {
        let feesGenerated = 0;
        const { id: campaignId, scope, associationId } = campaign;
        let userIds: string[] = [];

        if (scope === 'LOCAL') {
            const activeUsers = await this.prisma.user.findMany({
                where: { associationId, status: 'ACTIVE' },
                select: { id: true },
            });
            userIds = activeUsers.map(u => u.id);

        } else if (scope === 'NETWORK_MEMBERS') {
            const descendantIds = await this.getAllDescendantIds(associationId);
            const allAssocIds = [associationId, ...descendantIds];
            const activeUsers = await this.prisma.user.findMany({
                where: { associationId: { in: allAssocIds }, status: 'ACTIVE' },
                select: { id: true },
            });
            userIds = activeUsers.map(u => u.id);

        } else if (scope === 'NETWORK_BRANCHES') {
            const children = await this.prisma.association.findMany({
                where: { parentId: associationId },
                select: { id: true },
            });
            if (children.length > 0) {
                await this.prisma.fee.createMany({
                    data: children.map((c) => ({
                        targetAssociationId: c.id,
                        campaignId,
                        status: 'PENDING',
                    })),
                });
            }
            feesGenerated = children.length;
            return feesGenerated;
        }

        if (userIds.length > 0) {
            await this.prisma.fee.createMany({
                data: userIds.map((userId) => ({
                    userId,
                    campaignId,
                    status: 'PENDING',
                })),
            });

            // Emails
            const usersWithEmail = await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, firstName: true },
            });

            Promise.all(usersWithEmail.map(user => {
                if (user.email) {
                    return this.mailService.sendFeeCreatedEmail({
                        to: user.email,
                        memberName: user.firstName,
                        title: campaign.name,
                        amount: campaign.amount,
                        dueDate: campaign.due_date,
                        paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/finance/my-fees`,
                    }).catch(err => this.logger.error(`Failed to send email to ${user.email}: ${err.message}`));
                }
            }));
        }

        feesGenerated = userIds.length;
        return feesGenerated;
    }

    // ── CREATE CAMPAIGN ──
    async createCampaign(associationId: string, dto: CreateCampaignDto) {
        const scope = dto.scope || 'LOCAL';
        const frequency = dto.frequency || 'ONETIME';
        const dueDate = new Date(dto.due_date);

        const campaign = await this.prisma.campaign.create({
            data: {
                associationId,
                name: dto.name,
                amount: dto.amount,
                description: dto.description || null,
                due_date: dueDate,
                scope,
                frequency,
                nextRunAt: frequency !== 'ONETIME' ? this.calculateNextRun(dueDate, frequency) : null,
            },
        });

        const feesGenerated = await this.generateFeesForCampaign(campaign);
        return { ...campaign, feesGenerated };
    }

    // ── LIST ALL + STATS (Optimized) ──
    async findAllCampaigns(associationId: string) {
        const campaigns = await this.prisma.campaign.findMany({
            where: { associationId },
            orderBy: { createdAt: 'desc' },
        });

        if (campaigns.length === 0) return [];

        const campaignIds = campaigns.map(c => c.id);
        const feeStats = await this.prisma.fee.groupBy({
            by: ['campaignId', 'status'],
            where: { campaignId: { in: campaignIds } },
            _count: { _all: true },
        });

        return campaigns.map((c) => {
            const statsForCampaign = feeStats.filter(s => s.campaignId === c.id);
            let totalFees = 0, paidFees = 0, overdueFees = 0;

            for (const s of statsForCampaign) {
                totalFees += s._count._all;
                if (s.status === 'PAID') paidFees += s._count._all;
                if (s.status === 'OVERDUE') overdueFees += s._count._all;
            }

            const pendingFees = totalFees - paidFees - overdueFees;

            return {
                id: c.id,
                name: c.name,
                description: c.description,
                amount: c.amount,
                due_date: c.due_date,
                scope: c.scope,
                createdAt: c.createdAt,
                frequency: c.frequency,
                nextRunAt: c.nextRunAt,
                totalMembers: totalFees,
                paidMembers: paidFees,
                overdueFees,
                pendingFees,
                totalExpected: totalFees * c.amount,
                totalCollected: paidFees * c.amount,
                progress: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0,
            };
        });
    }

    // ── FIND ONE ──
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
                                association: { select: { id: true, name: true } },
                            },
                        },
                        targetAssociation: {
                            select: { id: true, name: true, address_city: true, networkLevel: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!campaign) throw new NotFoundException('Campagne non trouvée.');

        const totalFees = campaign.fees.length;
        const paidFees = campaign.fees.filter((f) => f.status === 'PAID').length;
        const overdueFees = campaign.fees.filter((f) => f.status === 'OVERDUE').length;
        const pendingFees = totalFees - paidFees - overdueFees;

        return {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            amount: campaign.amount,
            due_date: campaign.due_date,
            scope: campaign.scope,
            createdAt: campaign.createdAt,
            frequency: campaign.frequency,
            nextRunAt: campaign.nextRunAt,
            totalMembers: totalFees,
            paidMembers: paidFees,
            overdueFees,
            pendingFees,
            totalExpected: totalFees * campaign.amount,
            totalCollected: paidFees * campaign.amount,
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

    // ── CRON IMPLEMENTATION ──
    @Cron('0 2 * * *')
    async checkRecurringCampaigns() {
        this.logger.log('Checking for recurring campaigns...');
        const now = new Date();
        const dueCampaigns = await this.prisma.campaign.findMany({
            where: { isActive: true, frequency: { not: 'ONETIME' }, nextRunAt: { lte: now } },
        });

        for (const master of dueCampaigns) {
            try {
                const monthYear = master.nextRunAt?.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                const newName = `${master.name} - ${monthYear}`;

                const newCampaign = await this.prisma.campaign.create({
                    data: {
                        associationId: master.associationId,
                        name: newName,
                        amount: master.amount,
                        due_date: master.nextRunAt!,
                        scope: master.scope,
                        frequency: 'ONETIME',
                        nextRunAt: null,
                    },
                });

                await this.generateFeesForCampaign(newCampaign);

                const nextRun = this.calculateNextRun(master.nextRunAt!, master.frequency);
                await this.prisma.campaign.update({
                    where: { id: master.id },
                    data: { nextRunAt: nextRun },
                });
            } catch (error) {
                this.logger.error(`Failed to process campaign ${master.id}: ${error.message}`);
            }
        }
    }

    @Cron('0 9 * * *')
    async checkOverdueFees() {
        this.logger.log('Checking for overdue payments...');
        const dueFees = await this.prisma.fee.findMany({
            where: { status: 'PENDING', campaign: { due_date: { lt: new Date() } } },
            include: { user: true, campaign: true },
            take: 100
        });

        for (const fee of dueFees) {
            if (!fee.user?.email) continue;
            if (fee.status === 'PENDING') {
                await this.prisma.fee.update({ where: { id: fee.id }, data: { status: 'OVERDUE' } });
            }
            const daysOverdue = Math.floor((new Date().getTime() - new Date(fee.campaign.due_date).getTime()) / (1000 * 3600 * 24));
            if (daysOverdue > 0) {
                await this.mailService.sendPaymentReminderEmail({
                    to: fee.user.email,
                    memberName: fee.user.firstName,
                    title: fee.campaign.name,
                    amount: fee.campaign.amount,
                    daysOverdue,
                    paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/finance/my-fees`,
                }).catch(err => this.logger.error(`Failed to send reminder to ${fee.user.email}: ${err.message}`));
            }
        }
    }
}
