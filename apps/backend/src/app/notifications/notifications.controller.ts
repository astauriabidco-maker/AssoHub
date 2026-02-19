import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@GetUser('id') userId: string) {
        return this.notificationsService.findAll(userId);
    }

    @Get('unread-count')
    getUnreadCount(@GetUser('id') userId: string) {
        return this.notificationsService.getUnreadCount(userId);
    }

    @Patch('mark-all-read')
    markAllAsRead(@GetUser('id') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }

    @Patch(':id/read')
    markAsRead(
        @GetUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.notificationsService.markAsRead(userId, id);
    }
}
