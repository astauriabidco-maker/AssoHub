import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('associations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssociationsController {
    constructor(private readonly associationsService: AssociationsService) { }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll() {
        return this.associationsService.findAll();
    }

    @Get('me')
    getMe(@GetUser('associationId') associationId: string) {
        return this.associationsService.findOne(associationId);
    }

    @Patch('me')
    updateMe(
        @GetUser('associationId') associationId: string,
        @Body() dto: UpdateAssociationDto,
    ) {
        return this.associationsService.update(associationId, dto);
    }

    @Patch(':id/toggle-status')
    @Roles('SUPER_ADMIN')
    toggleStatus(@Param('id') id: string) {
        return this.associationsService.toggleStatus(id);
    }
}
