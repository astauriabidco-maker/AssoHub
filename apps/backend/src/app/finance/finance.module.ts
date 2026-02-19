import { Module, forwardRef } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { UsersModule } from '../users/users.module';
import { CampaignService } from './services/campaign.service';
import { TreasuryService } from './services/treasury.service';
import { PaymentService } from './services/payment.service';
import { ReportService } from './services/report.service';

@Module({
    controllers: [FinanceController],
    providers: [
        FinanceService,
        CampaignService,
        TreasuryService,
        PaymentService,
        ReportService
    ],
    imports: [forwardRef(() => UsersModule)],
    exports: [FinanceService],
})
export class FinanceModule { }
