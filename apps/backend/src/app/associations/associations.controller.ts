import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { CreateChildDto } from './dto/create-child.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('associations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssociationsController {
    constructor(private readonly associationsService: AssociationsService) { }

    @Get('me')
    async getMyAssociation(@GetUser('associationId') associationId: string) {
        return this.associationsService.findOne(associationId);
    }

    @Patch('me')
    @Permissions('settings.manage')
    async updateMyAssociation(
        @GetUser('associationId') associationId: string,
        @Req() req: any,
        @Body() dto: UpdateAssociationDto,
    ) {
        return this.associationsService.update(
            associationId,
            req.user.role,
            dto,
        );
    }

    // ── Réseau hiérarchique ──
    @Get('network')
    @Permissions('settings.manage')
    async getNetwork(@GetUser('associationId') associationId: string) {
        return this.associationsService.getNetwork(associationId);
    }

    // ── Créer une antenne ──
    @Post('children')
    @Permissions('settings.manage')
    async createChild(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateChildDto,
    ) {
        return this.associationsService.createChild(associationId, dto);
    }

    // ── Stats réseau consolidées ──
    @Get('network/stats')
    @Permissions('settings.manage')
    async getNetworkStats(@GetUser('associationId') associationId: string) {
        return this.associationsService.getNetworkStats(associationId);
    }

    // ── Stats dashboard ──
    @Get('dashboard/stats')
    async getDashboardStats(@GetUser('associationId') associationId: string) {
        return this.associationsService.getDashboardStats(associationId);
    }
}
