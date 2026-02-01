import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
    constructor(private prisma: PrismaService) { }

    async getGlobalStats() {
        const [totalAssociations, totalUsers, totalTransactions] = await Promise.all([
            this.prisma.association.count(),
            this.prisma.user.count(),
            this.prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { type: 'INCOME' },
            }),
        ]);

        // Revenus estimés basés sur les plans (simulation)
        const associations = await this.prisma.association.findMany({
            select: { subscription_plan: true },
        });

        const estimatedRevenue = associations.reduce((acc, asso) => {
            switch (asso.subscription_plan) {
                case 'PRO': return acc + 29;
                case 'ENTERPRISE': return acc + 99;
                default: return acc;
            }
        }, 0);

        // Statistiques mensuelles pour le graphique
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentAssociations = await this.prisma.association.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true },
        });

        const monthlyStats = this.groupByMonth(recentAssociations);

        return {
            totalAssociations,
            totalUsers,
            estimatedMonthlyRevenue: estimatedRevenue,
            totalTransactionVolume: totalTransactions._sum.amount || 0,
            monthlyNewAssociations: monthlyStats,
        };
    }

    private groupByMonth(associations: { createdAt: Date }[]): { month: string; count: number }[] {
        const months: Record<string, number> = {};
        const now = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            months[key] = 0;
        }

        associations.forEach((a) => {
            const key = a.createdAt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            if (months[key] !== undefined) {
                months[key]++;
            }
        });

        return Object.entries(months).map(([month, count]) => ({ month, count }));
    }

    async getAllAssociations() {
        const associations = await this.prisma.association.findMany({
            include: {
                users: {
                    where: {
                        role: { in: ['PRESIDENT', 'ADMIN'] },
                    },
                    select: {
                        email: true,
                        role: true,
                    },
                    take: 1,
                },
                _count: {
                    select: { users: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return associations.map((asso) => ({
            id: asso.id,
            name: asso.name,
            slug: asso.slug,
            adminEmail: asso.users[0]?.email || asso.contact_email || 'N/A',
            plan: asso.subscription_plan,
            memberCount: asso._count.users,
            isActive: asso.is_active,
            createdAt: asso.createdAt,
        }));
    }

    async toggleSuspend(id: string) {
        const association = await this.prisma.association.findUnique({
            where: { id },
        });

        if (!association) {
            throw new Error('Association not found');
        }

        const updated = await this.prisma.association.update({
            where: { id },
            data: { is_active: !association.is_active },
        });

        return {
            id: updated.id,
            name: updated.name,
            isActive: updated.is_active,
        };
    }

    async deleteAssociation(id: string) {
        // Suppression en cascade (dans un vrai projet, soft delete recommandé)
        await this.prisma.association.delete({
            where: { id },
        });

        return { success: true, deletedId: id };
    }
}
