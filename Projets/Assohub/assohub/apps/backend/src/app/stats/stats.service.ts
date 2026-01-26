import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private prisma: PrismaService) { }

    async getGlobalStats(associationId: string) {
        // 1. KPIs
        const totalMembers = await this.prisma.user.count({
            where: { associationId, role: 'MEMBER' },
        });

        const transactions = await this.prisma.transaction.findMany({
            where: { associationId },
        });

        const treasury = transactions.reduce((acc, t) => {
            return t.type === 'INCOME' ? acc + t.amount : acc - t.amount;
        }, 0);

        const upcomingEvents = await this.prisma.event.count({
            where: {
                associationId,
                start_date: { gte: new Date() },
            },
        });

        // 2. Chart Data (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentTransactions = await this.prisma.transaction.findMany({
            where: {
                associationId,
                date: { gte: sixMonthsAgo },
            },
            orderBy: { date: 'asc' },
        });

        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const chartDataMap = new Map();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = months[d.getMonth()];
            chartDataMap.set(monthName, { name: monthName, income: 0, expense: 0 });
        }

        recentTransactions.forEach(t => {
            const monthName = months[new Date(t.date).getMonth()];
            if (chartDataMap.has(monthName)) {
                const data = chartDataMap.get(monthName);
                if (t.type === 'INCOME') data.income += t.amount;
                else data.expense += t.amount;
            }
        });

        const chartData = Array.from(chartDataMap.values());

        // 3. Member Status (Pie Chart)
        const membersWithFees = await this.prisma.user.findMany({
            where: { associationId, role: 'MEMBER' },
            include: { fees: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });

        let paid = 0, overdue = 0, pending = 0;
        membersWithFees.forEach(m => {
            const status = m.fees[0]?.status || 'PENDING';
            if (status === 'PAID') paid++;
            else if (status === 'OVERDUE') overdue++;
            else pending++;
        });

        const pieData = [
            { name: 'À jour', value: paid, color: '#10b981' },
            { name: 'En retard', value: overdue, color: '#ef4444' },
            { name: 'En attente', value: pending, color: '#f59e0b' },
        ];

        // 4. Recent Activities
        const lastTransactions = await this.prisma.transaction.findMany({
            where: { associationId },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { fee: { include: { user: true } } }
        });

        const lastEvents = await this.prisma.event.findMany({
            where: { associationId },
            take: 2,
            orderBy: { createdAt: 'desc' },
        });

        const activities = [
            ...lastTransactions.map(t => ({
                id: t.id,
                type: 'FINANCE',
                message: `${t.fee?.user?.firstName || 'Quelqu\'un'} a effectué un ${t.type === 'INCOME' ? 'revenu' : 'dépense'} de ${t.amount}€`,
                date: t.createdAt
            })),
            ...lastEvents.map(e => ({
                id: e.id,
                type: 'EVENT',
                message: `Nouvel événement créé : ${e.title}`,
                date: e.createdAt
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            kpis: {
                totalMembers,
                treasury,
                upcomingEvents,
                variation: "+5%" // Simulated
            },
            chartData,
            pieData,
            activities: activities.slice(0, 5)
        };
    }
}
