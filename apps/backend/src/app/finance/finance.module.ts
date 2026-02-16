import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [PrismaModule, RolesModule],
    controllers: [FinanceController],
    providers: [FinanceService],
})
export class FinanceModule { }
