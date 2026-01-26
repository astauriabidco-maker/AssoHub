import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    findAll(@GetUser('associationId') associationId: string) {
        return this.eventsService.findAll(associationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Post()
    create(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateEventDto,
    ) {
        return this.eventsService.create(associationId, dto);
    }

    @Post(':id/convocation')
    simulateConvocation(@Param('id') id: string) {
        return this.eventsService.simulateConvocation(id);
    }
}
