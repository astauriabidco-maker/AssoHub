import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('communication')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
    constructor(private readonly communicationService: CommunicationService) { }

    @Post('announcements')
    createAnnouncement(
        @GetUser('associationId') associationId: string,
        @GetUser('sub') userId: string,
        @GetUser('role') role: string,
        @Body() dto: CreateAnnouncementDto,
    ) {
        // Only ADMIN or PRESIDENT can create announcements
        if (!['ADMIN', 'PRESIDENT'].includes(role)) {
            throw new ForbiddenException('Seuls les administrateurs peuvent publier des annonces');
        }
        return this.communicationService.createAnnouncement(associationId, userId, dto);
    }

    @Get('announcements')
    getAnnouncements(@GetUser('associationId') associationId: string) {
        return this.communicationService.getAnnouncements(associationId);
    }
}
