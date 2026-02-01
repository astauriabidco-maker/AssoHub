import { Controller, Get, Post, Patch, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { FinanceService } from './finance.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('stats')
    getStats(@GetUser('associationId') associationId: string) {
        return this.financeService.getStats(associationId);
    }

    @Get('campaigns')
    getCampaigns(@GetUser('associationId') associationId: string) {
        return this.financeService.getCampaigns(associationId);
    }

    @Post('campaigns')
    createCampaign(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateCampaignDto,
    ) {
        return this.financeService.createCampaign(associationId, dto);
    }

    @Get('campaigns/:id')
    getCampaignDetails(@Param('id') id: string) {
        return this.financeService.getCampaignDetails(id);
    }

    @Patch('fees/:id/pay')
    markFeeAsPaid(@Param('id') id: string) {
        return this.financeService.markFeeAsPaid(id);
    }

    @Post('expense')
    createExpense(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateExpenseDto,
    ) {
        return this.financeService.createExpense(associationId, dto);
    }

    @Get('expenses')
    getExpenses(@GetUser('associationId') associationId: string) {
        return this.financeService.getExpenses(associationId);
    }

    @Get('ledger')
    getLedger(@GetUser('associationId') associationId: string) {
        return this.financeService.getLedger(associationId);
    }

    @Get('export')
    async exportCsv(
        @GetUser('associationId') associationId: string,
        @Res() res: Response,
    ) {
        const csv = await this.financeService.exportCsv(associationId);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=grand_livre.csv');
        res.send(csv);
    }
}

