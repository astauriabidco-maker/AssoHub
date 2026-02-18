import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async createWallet(userId: string) {
        return this.prisma.wallet.create({
            data: { userId },
        });
    }

    async getWallet(userId: string) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!wallet) {
            await this.createWallet(userId);
            // Reload with transactions (empty)
            return this.prisma.wallet.findUnique({
                where: { userId },
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            });
        }

        return wallet;
    }

    async getHistory(userId: string, page = 1, limit = 10) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return { data: [], total: 0, page, limit, totalPages: 0 };

        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
        ]);

        return {
            data: transactions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // User requests a top-up (declarative)
    async requestTopUp(userId: string, dto: CreateTransactionDto) {
        const wallet = await this.getWallet(userId);

        if (dto.amount <= 0) throw new BadRequestException("Amount must be positive");

        return this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: dto.amount,
                type: 'DEPOSIT',
                status: 'PENDING',
                reference: dto.reference,
                description: dto.description || 'Déclaration de rechargement',
            },
        });
    }

    // Admin credits directly
    async adminCredit(userId: string, amount: number, reference: string, description: string) {
        const wallet = await this.getWallet(userId);

        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: amount >= 0 ? 'DEPOSIT' : 'ADJUSTMENT',
                    status: 'COMPLETED',
                    reference,
                    description,
                },
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } },
            });

            return transaction;
        });
    }

    // Admin validates a pending request
    async validateTransaction(transactionId: string) {
        const tx = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
        if (!tx) throw new NotFoundException("Transaction not found");
        if (tx.status !== 'PENDING') throw new BadRequestException("Transaction already processed");

        return this.prisma.$transaction(async (prismaTx) => {
            const updatedTx = await prismaTx.walletTransaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED' },
            });

            await prismaTx.wallet.update({
                where: { id: tx.walletId },
                data: { balance: { increment: tx.amount } },
            });

            return updatedTx;
        });
    }

    // Admin rejects a pending request
    async rejectTransaction(transactionId: string) {
        const tx = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
        if (!tx) throw new NotFoundException("Transaction not found");
        if (tx.status !== 'PENDING') throw new BadRequestException("Transaction already processed");

        return this.prisma.walletTransaction.update({
            where: { id: transactionId },
            data: { status: 'FAILED' },
        });
    }
}
