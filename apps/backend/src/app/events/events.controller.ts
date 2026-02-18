import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @Permissions('events.edit')
    create(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateEventDto,
    ) {
        return this.eventsService.create(associationId, dto);
    }

    @Get()
    @Permissions('events.view')
    findAll(@GetUser('associationId') associationId: string) {
        return this.eventsService.findAll(associationId);
    }

    @Get(':id')
    @Permissions('events.view')
    findOne(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.eventsService.findOne(associationId, id);
    }

    @Post(':id/register')
    @Permissions('events.view')
    register(
        @GetUser('associationId') associationId: string,
        @GetUser('sub') userId: string,
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        return this.eventsService.register(associationId, id, userId, status);
    }
}
