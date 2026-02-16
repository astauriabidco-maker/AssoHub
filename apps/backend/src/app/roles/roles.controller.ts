import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
    constructor(private rolesService: RolesService) { }

    @Get()
    findAll(@Req() req: any) {
        return this.rolesService.findAll(req.user.associationId);
    }

    @Get('permissions')
    getPermissions() {
        return this.rolesService.getAvailablePermissions();
    }

    @Post()
    @Permissions('roles.manage')
    create(@Req() req: any, @Body() body: { name: string; slug: string; color?: string; permissions: string[] }) {
        return this.rolesService.create(req.user.associationId, body);
    }

    @Patch(':id')
    @Permissions('roles.manage')
    update(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; color?: string; permissions?: string[] }) {
        return this.rolesService.update(req.user.associationId, id, body);
    }

    @Delete(':id')
    @Permissions('roles.manage')
    remove(@Req() req: any, @Param('id') id: string) {
        return this.rolesService.remove(req.user.associationId, id);
    }
}
