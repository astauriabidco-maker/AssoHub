import { Module } from '@nestjs/common';
import { FamilyLinksController } from './family-links.controller';
import { FamilyLinksService } from './family-links.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FamilyLinksController],
    providers: [FamilyLinksService],
    exports: [FamilyLinksService],
})
export class FamilyLinksModule { }
