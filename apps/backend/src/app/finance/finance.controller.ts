"use client";

import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Res,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { Response } from 'express'; // Required here

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    // ── REPORTING (NEW) ──

    // 1. Download Ledger CSV (Backend Generated)
    @Get('ledger/export')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    async exportLedger(
        @GetUser('associationId') associationId: string,
        @Res() res: Response,
    ) {
        return this.financeService.downloadLedgerCsv(associationId, res);
    }

    // 2. Download Receipt PDF
    @Get('fees/:id/receipt')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    // Permission check? Usually 'finance.view' OR 'own.fee' (Self-Service)
    // For simplicity, we assume if you can access the fee via findFeesForUser you can download.
    // Ideally, service handles ownership check.
    async downloadReceipt(
        @Param('id') feeId: string,
        @Res() res: Response,
    ) {
        return this.financeService.downloadReceipt(feeId, res);
    }


    // ── Stats globales ──
    @Get('stats')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    getStats(@GetUser('associationId') associationId: string) {
        return this.financeService.getGlobalStats(associationId);
    }

    // ── Résumé financier par membre (badges liste) ──
    @Get('members-summary')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    getMembersSummary(@GetUser('associationId') associationId: string) {
        return this.financeService.getMemberFinanceSummary(associationId);
    }

    // ── Mes Cotisations (Self-Service) ──
    @Get('fees/me')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    getFeesForMe(
        @GetUser('associationId') associationId: string,
        @GetUser('id') userId: string,
    ) {
        return this.financeService.findFeesForUser(associationId, userId);
    }

    // ── Payer avec mon Portefeuille ──
    @Post('fees/:id/pay-with-wallet')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    payFeeWithWallet(
        @GetUser('id') userId: string,
        @Param('id') feeId: string,
    ) {
        return this.financeService.payFeeWithWallet(userId, feeId);
    }

    // ── Payer en ligne (Direct Payment) ──
    @Post('fees/:id/pay-online')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    payFeeOnline(
        @GetUser('id') userId: string,
        @Param('id') feeId: string,
        @Body() body: { provider: string; phoneNumber?: string },
    ) {
        return this.financeService.payFeeOnline(userId, feeId, body);
    }

    // ── Cotisations d'un membre (Admin View) ──
    @Get('fees/user/:userId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    getFeesForUser(
        @GetUser('associationId') associationId: string,
        @Param('userId') userId: string,
    ) {
        return this.financeService.findFeesForUser(associationId, userId);
    }

    // ── Créer une campagne (+ auto-générer les dettes) ──
    @Post('campaigns')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    createCampaign(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateCampaignDto,
    ) {
        return this.financeService.createCampaign(associationId, dto);
    }

    // ── Liste des campagnes avec stats ──
    @Get('campaigns')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    findAllCampaigns(@GetUser('associationId') associationId: string) {
        return this.financeService.findAllCampaigns(associationId);
    }

    // ── Détail d'une campagne avec fees ──
    @Get('campaigns/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    findOneCampaign(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.financeService.findOneCampaign(associationId, id);
    }

    // ── TRIGGER CRON (TEST ONLY) ──
    @Post('cron/trigger')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    triggerCron() {
        return this.financeService.triggerCron();
    }

    // ── TREASURY ──
    @Get('treasury-accounts')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    getTreasuryAccounts(@GetUser('associationId') associationId: string) {
        return this.financeService.getTreasuryAccounts(associationId);
    }

    @Post('treasury-accounts')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    createTreasuryAccount(
        @GetUser('associationId') associationId: string,
        @Body() body: { name: string; type: string; initialBalance?: number },
    ) {
        return this.financeService.createTreasuryAccount(associationId, body.name, body.type, body.initialBalance);
    }

    // ── WEBHOOKS (Public / No Auth Guard for real implementation usually, but here requires care) ──
    @Post('webhooks/:provider')
    // @Public() // Ideally this should be public or guarded by provider signature
    handleWebhook(
        @Param('provider') provider: string,
        @Body() payload: any,
    ) {
        return this.financeService.handlePaymentWebhook(provider, payload);
    }

    // ── Encaisser un paiement (Admin Action) ──
    @Patch('fees/:id/pay')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    payFee(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() body: { paymentMethod?: string; treasuryAccountId?: string },
    ) {
        return this.financeService.payFee(associationId, id, body?.paymentMethod, body?.treasuryAccountId);
    }

    // ── Saisir une dépense ──
    @Post('transactions/expense')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    createExpense(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateExpenseDto & { treasuryAccountId?: string },
    ) {
        return this.financeService.createExpense(associationId, dto);
    }

    // ── Grand Livre (toutes les transactions + solde) ──
    @Get('ledger')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.view')
    getLedger(@GetUser('associationId') associationId: string) {
        return this.financeService.getLedger(associationId);
    }

    // ── PAYMENT CONFIGURATION ──
    @Get('config')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    getPaymentConfig(@GetUser('associationId') associationId: string) {
        return this.financeService.getPaymentConfig(associationId);
    }

    @Patch('config')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('finance.edit')
    updatePaymentConfig(
        @GetUser('associationId') associationId: string,
        @Body() dto: any,
    ) {
        return this.financeService.updatePaymentConfig(associationId, dto);
    }
}
