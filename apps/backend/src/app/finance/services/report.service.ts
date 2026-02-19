"use client";

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ReportService {
    private readonly logger = new Logger(ReportService.name);

    constructor(private prisma: PrismaService) { }

    // ── RECEIPT GENERATION (PDF) ──
    async generateReceiptPdf(feeId: string, res: Response) {
        // 1. Fetch Data
        const fee = await this.prisma.fee.findUnique({
            where: { id: feeId },
            include: {
                campaign: { include: { association: true } },
                user: true,
                transaction: true,
            },
        });

        if (!fee || !fee.transaction) {
            throw new Error("Impossible de générer le reçu : Paiement introuvable.");
        }

        const doc = new PDFDocument({ margin: 50 });

        // Stream into Response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=recu-${feeId.substring(0, 8)}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(fee.campaign.association.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('REÇU DE PAIEMENT', { align: 'center', underline: true });

        doc.moveDown(2);

        // Details
        doc.fontSize(12);
        doc.text(`Réf. Transaction: ${fee.transaction.id}`);
        doc.text(`Date: ${fee.transaction.date.toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        doc.text(`Reçu de: ${fee.user?.firstName} ${fee.user?.lastName}`);
        doc.text(`Pour: ${fee.campaign.name}`);

        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold')
            .text(`Montant Payé: ${fee.transaction.amount} XAF`, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica')
            .fillColor('grey')
            .text('Ce reçu est généré électroniquement par AssoHub.', { align: 'center' });

        doc.end();
    }

    // ── LEDGER EXPORT (CSV) ──
    async generateLedgerCsv(associationId: string, res: Response) {
        // 1. Fetch All Transactions
        const transactions = await this.prisma.transaction.findMany({
            where: { associationId },
            orderBy: { date: 'desc' },
            include: { treasuryAccount: true }
        });

        // 2. Setup Header
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=grand-livre-${new Date().toISOString().split('T')[0]}.csv`);

        // 3. Write CSV Content
        res.write('Date,Type,Categorie,Description,Montant,Methode,Compte\n');

        for (const t of transactions) {
            const line = [
                t.date.toLocaleDateString('fr-FR'),
                t.type,
                t.category,
                `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
                t.amount,
                t.paymentMethod,
                t.treasuryAccount?.name || 'Inconnu'
            ].join(',');

            res.write(line + '\n');
        }

        res.end();
    }
}
