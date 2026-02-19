import { Controller, Post, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { UserAssociationsService } from './user-associations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('user-associations')
@UseGuards(JwtAuthGuard)
export class UserAssociationsController {
    constructor(private readonly service: UserAssociationsService) { }

    @Post()
    async attach(
        @GetUser('associationId') associationId: string,
        @Body() dto: { userId: string; associationId: string; role?: string },
    ) {
        return this.service.attach(dto, associationId);
    }

    @Delete(':id')
    async detach(@Param('id') id: string) {
        return this.service.detach(id);
    }

    @Get('association/:associationId')
    async findByAssociation(@Param('associationId') associationId: string) {
        return this.service.findByAssociation(associationId);
    }

    @Get('user/:userId')
    async findByUser(@Param('userId') userId: string) {
        return this.service.findByUser(userId);
    }
}
