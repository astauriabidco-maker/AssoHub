import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
    constructor(private readonly superAdminService: SuperAdminService) { }

    @Get('stats')
    async getGlobalStats() {
        return this.superAdminService.getGlobalStats();
    }

    @Get('associations')
    async getAllAssociations() {
        return this.superAdminService.getAllAssociations();
    }

    @Patch('associations/:id/suspend')
    async toggleSuspend(@Param('id') id: string) {
        return this.superAdminService.toggleSuspend(id);
    }

    @Delete('associations/:id')
    @HttpCode(HttpStatus.OK)
    async deleteAssociation(@Param('id') id: string) {
        return this.superAdminService.deleteAssociation(id);
    }
}
