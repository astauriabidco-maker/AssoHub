import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('associations')
@UseGuards(JwtAuthGuard)
export class AssociationsController {
    constructor(private readonly associationsService: AssociationsService) { }

    @Get('me')
    getMe(@GetUser('associationId') associationId: string) {
        return this.associationsService.findOne(associationId);
    }

    @Patch('me')
    updateMe(
        @GetUser('associationId') associationId: string,
        @Body() dto: UpdateAssociationDto,
    ) {
        // Remove sensitive fields if necessary, or rely on DTO validation
        return this.associationsService.update(associationId, dto);
    }

    @Patch(':id/toggle-status')
    toggleStatus(@Param('id') id: string) {
        // En prod, ceci devrait être protégé par un RoleGuard SUPER_ADMIN
        return this.associationsService.toggleStatus(id);
    }
}
