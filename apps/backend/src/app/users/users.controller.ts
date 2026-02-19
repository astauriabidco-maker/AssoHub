import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Res,
    Header,
    Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Permissions('members.view')
    findAll(
        @GetUser('associationId') associationId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.findAll(
            associationId,
            page ? parseInt(page, 10) : 1,
            limit ? Math.min(parseInt(limit, 10), 500) : 50,
        );
    }

    @Get('export/csv')
    @Permissions('members.view')
    async exportCsv(
        @GetUser('associationId') associationId: string,
        @Res() res: Response,
    ) {
        const csv = await this.usersService.exportCsv(associationId);
        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="membres_${date}.csv"`);
        // BOM for Excel UTF-8 compatibility
        res.send('\uFEFF' + csv);
    }

    @Get('export/template')
    @Permissions('members.edit')
    async exportTemplate(@Res() res: Response) {
        const headers = 'prenom,nom,email,telephone,genre,role,ville_residence,pays_residence,branche_familiale,date_naissance,date_adhesion,parent1,parent2,conjoint';
        const example = 'Jean,Dupont,jean@example.com,+237600000000,MALE,MEMBER,Douala,CM,Branche Pierre,1990-01-15,,Pierre Dupont,,Marie Dupont';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import.csv"');
        res.send('\uFEFF' + headers + '\n' + example);
    }

    @Post('import/csv')
    @Permissions('members.edit')
    async importCsv(
        @GetUser('associationId') associationId: string,
        @Body('csv') csvContent: string,
    ) {
        return this.usersService.importCsv(associationId, csvContent);
    }

    @Post()
    @Permissions('members.edit')
    create(
        @GetUser('associationId') associationId: string,
        @Body() createUserDto: CreateUserDto,
    ) {
        return this.usersService.create(associationId, createUserDto);
    }

    @Patch(':id/status')
    @Permissions('members.edit')
    updateStatus(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body('status') status: 'ACTIVE' | 'SUSPENDED',
    ) {
        return this.usersService.updateStatus(associationId, id, status);
    }

    @Patch(':id')
    @Permissions('members.edit')
    update(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(associationId, id, updateUserDto);
    }

    @Delete(':id')
    @Permissions('members.edit')
    remove(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.usersService.remove(associationId, id);
    }

    @Post(':id/invite')
    @Permissions('members.edit')
    async sendInvitation(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const baseUrl = (req.headers.origin as string) || 'http://localhost:4200';
        return this.usersService.sendInvitation(associationId, id, baseUrl);
    }
}
