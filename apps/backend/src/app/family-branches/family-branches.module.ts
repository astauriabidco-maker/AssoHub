import { Module } from '@nestjs/common';
import { FamilyBranchesService } from './family-branches.service';
import { FamilyBranchesController } from './family-branches.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FamilyBranchesController],
    providers: [FamilyBranchesService],
    exports: [FamilyBranchesService],
})
export class FamilyBranchesModule { }
