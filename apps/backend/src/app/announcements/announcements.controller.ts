import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('announcements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Get()
    @Permissions('dashboard.view')
    async findAll(@GetUser('associationId') associationId: string) {
        return this.announcementsService.findAll(associationId);
    }

    @Post()
    @Permissions('settings.manage')
    async create(
        @GetUser('associationId') associationId: string,
        @GetUser('sub') userId: string,
        @Body() body: { title: string; content: string; scope?: string },
    ) {
        return this.announcementsService.create(associationId, userId, body);
    }

    @Delete(':id')
    @Permissions('settings.manage')
    async delete(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.announcementsService.delete(id, associationId);
    }
}
