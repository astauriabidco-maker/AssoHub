import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [PrismaModule, RolesModule],
    providers: [AnnouncementsService],
    controllers: [AnnouncementsController],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule { }
