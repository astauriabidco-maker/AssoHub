import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    // ── Stats globales ──
    @Get('stats')
    @Permissions('finance.view')
    getStats(@GetUser('associationId') associationId: string) {
        return this.financeService.getGlobalStats(associationId);
    }

    // ── Résumé financier par membre (badges liste) ──
    @Get('members-summary')
    @Permissions('finance.view')
    getMembersSummary(@GetUser('associationId') associationId: string) {
        return this.financeService.getMemberFinanceSummary(associationId);
    }

    // ── Cotisations d'un membre ──
    @Get('fees/user/:userId')
    @Permissions('finance.view')
    getFeesForUser(
        @GetUser('associationId') associationId: string,
        @Param('userId') userId: string,
    ) {
        return this.financeService.findFeesForUser(associationId, userId);
    }

    // ── Créer une campagne (+ auto-générer les dettes) ──
    @Post('campaigns')
    @Permissions('finance.edit')
    createCampaign(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateCampaignDto,
    ) {
        return this.financeService.createCampaign(associationId, dto);
    }

    // ── Liste des campagnes avec stats ──
    @Get('campaigns')
    @Permissions('finance.view')
    findAllCampaigns(@GetUser('associationId') associationId: string) {
        return this.financeService.findAllCampaigns(associationId);
    }

    // ── Détail d'une campagne avec fees ──
    @Get('campaigns/:id')
    @Permissions('finance.view')
    findOneCampaign(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.financeService.findOneCampaign(associationId, id);
    }

    // ── Encaisser un paiement ──
    @Patch('fees/:id/pay')
    @Permissions('finance.edit')
    payFee(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() body: { paymentMethod?: string },
    ) {
        return this.financeService.payFee(associationId, id, body?.paymentMethod);
    }

    // ── Saisir une dépense ──
    @Post('transactions/expense')
    @Permissions('finance.edit')
    createExpense(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateExpenseDto,
    ) {
        return this.financeService.createExpense(associationId, dto);
    }

    // ── Grand Livre (toutes les transactions + solde) ──
    @Get('ledger')
    @Permissions('finance.view')
    getLedger(@GetUser('associationId') associationId: string) {
        return this.financeService.getLedger(associationId);
    }
}
