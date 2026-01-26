import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
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
}
