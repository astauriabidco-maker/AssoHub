"use client";

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';

@Injectable()
export class TreasuryService {
    private readonly logger = new Logger(TreasuryService.name);

    constructor(private prisma: PrismaService) { }

    // ── ACCOUNTS MANAGER ──
    async getAccounts(associationId: string) {
        return this.prisma.treasuryAccount.findMany({
            where: { associationId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async createAccount(associationId: string, name: string, type: string, initialBalance = 0) {
        return this.prisma.treasuryAccount.create({
            data: {
                associationId,
                name,
                type,
                balance: initialBalance,
            },
        });
    }

    async getOrCreateDefaultAccount(associationId: string): Promise<string> {
        let treasury = await this.prisma.treasuryAccount.findFirst({
            where: { associationId, type: 'BANK' }
        });

        if (!treasury) {
            treasury = await this.prisma.treasuryAccount.findFirst({
                where: { associationId }
            });
            if (!treasury) {
                treasury = await this.prisma.treasuryAccount.create({
                    data: {
                        associationId: associationId,
                        name: "Compte (Défaut)",
                        type: "BANK",
                        balance: 0
                    }
                });
            }
        }
        return treasury.id;
    }

    // ── CREATE TRANSACTION (GENERIC) ──
    async createTransaction(data: {
        associationId: string;
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        category: string;
        paymentMethod: string;
        description?: string;
        treasuryAccountId?: string;
        date?: Date;
    }) {
        let accountId = data.treasuryAccountId;
        if (!accountId) {
            accountId = await this.getOrCreateDefaultAccount(data.associationId);
        }

        const transaction = await this.prisma.transaction.create({
            data: {
                associationId: data.associationId,
                amount: data.amount,
                type: data.type,
                category: data.category,
                paymentMethod: data.paymentMethod,
                description: data.description || '',
                treasuryAccountId: accountId,
                date: data.date || new Date(),
            }
        });

        // Update Balance
        if (accountId) {
            if (data.type === 'INCOME') {
                await this.prisma.treasuryAccount.update({
                    where: { id: accountId },
                    data: { balance: { increment: data.amount } }
                });
            } else {
                await this.prisma.treasuryAccount.update({
                    where: { id: accountId },
                    data: { balance: { decrement: data.amount } }
                });
            }
        }

        return transaction;
    }

    // ── CREATE EXPENSE HELPER ──
    async createExpense(associationId: string, dto: CreateExpenseDto & { treasuryAccountId?: string }) {
        return this.createTransaction({
            associationId,
            amount: dto.amount,
            type: 'EXPENSE',
            category: dto.category || 'AUTRE',
            paymentMethod: dto.paymentMethod || 'CASH',
            description: dto.description,
            treasuryAccountId: dto.treasuryAccountId,
            date: dto.date ? new Date(dto.date) : new Date(),
        })
    }

    // ── GET LEDGER (ALL TRANSACTIONS + BALANCE) ──
    async getLedger(associationId: string) {
        const transactions = await this.prisma.transaction.findMany({
            where: { associationId },
            include: { treasuryAccount: true },
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
                treasuryAccount: t.treasuryAccount ? t.treasuryAccount.name : null,
                createdAt: t.createdAt,
            })),
        };
    }
}
