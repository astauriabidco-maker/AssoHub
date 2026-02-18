import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Query,
    Body,
    Param,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { DirectoryService } from './directory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('directory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DirectoryController {
    constructor(private readonly directoryService: DirectoryService) { }

    // ── Recherche à facettes (paginée) ──
    @Get()
    @Permissions('members.view')
    search(
        @GetUser('associationId') associationId: string,
        @Query('search') search?: string,
        @Query('industrySector') industrySector?: string,
        @Query('professionalStatus') professionalStatus?: string,
        @Query('educationLevel') educationLevel?: string,
        @Query('availableForMentoring') mentoring?: string,
        @Query('city') city?: string,
        @Query('skillName') skillName?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.directoryService.searchDirectory(
            associationId,
            {
                search,
                industrySector,
                professionalStatus,
                educationLevel,
                availableForMentoring: mentoring === 'true' ? true : mentoring === 'false' ? false : undefined,
                city,
                skillName,
            },
            page ? parseInt(page, 10) : 1,
            limit ? Math.min(parseInt(limit, 10), 50) : 12,
        );
    }

    // ── Dashboard stats ──
    @Get('stats')
    @Permissions('members.view')
    getStats(@GetUser('associationId') associationId: string) {
        return this.directoryService.getDirectoryStats(associationId);
    }

    // ── Mentors (paginés) ──
    @Get('mentors')
    @Permissions('members.view')
    getMentors(
        @GetUser('associationId') associationId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.directoryService.getMentors(
            associationId,
            page ? parseInt(page, 10) : 1,
            limit ? Math.min(parseInt(limit, 10), 50) : 12,
        );
    }

    // ── Export CSV ──
    @Get('export')
    @Permissions('members.view')
    async exportCsv(
        @GetUser('associationId') associationId: string,
        @Res() res: Response,
        @Query('industrySector') industrySector?: string,
        @Query('professionalStatus') professionalStatus?: string,
        @Query('educationLevel') educationLevel?: string,
        @Query('availableForMentoring') mentoring?: string,
    ) {
        const csv = await this.directoryService.exportDirectory(associationId, {
            industrySector,
            professionalStatus,
            educationLevel,
            availableForMentoring: mentoring === 'true' ? true : mentoring === 'false' ? false : undefined,
        });
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="annuaire_${new Date().toISOString().slice(0, 10)}.csv"`,
        });
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    }

    // ── All skills ──
    @Get('skills')
    @Permissions('members.view')
    getSkills(@GetUser('associationId') associationId: string) {
        return this.directoryService.getSkills(associationId);
    }

    // ── Auto-complétion compétences ──
    @Get('skills/suggest')
    @Permissions('members.view')
    suggestSkills(
        @GetUser('associationId') associationId: string,
        @Query('q') query: string,
    ) {
        return this.directoryService.suggestSkills(associationId, query);
    }

    // ── User skills ──
    @Get('skills/user/:userId')
    @Permissions('members.view')
    getUserSkills(
        @GetUser('associationId') associationId: string,
        @Param('userId') userId: string,
    ) {
        return this.directoryService.getUserSkills(associationId, userId);
    }

    // ── Update professional profile ──
    @Patch('profile/:userId')
    @Permissions('members.edit')
    updateProfile(
        @GetUser('associationId') associationId: string,
        @Param('userId') userId: string,
        @Body()
        body: {
            professionalStatus?: string;
            jobTitle?: string;
            industrySector?: string;
            employer?: string;
            educationLevel?: string;
            fieldOfStudy?: string;
            availableForMentoring?: boolean;
            profileVisibility?: string;
        },
    ) {
        return this.directoryService.updateProfessionalProfile(associationId, userId, body);
    }

    // ── Add skill ──
    @Post('skills/user/:userId')
    @Permissions('members.edit')
    addSkill(
        @GetUser('associationId') associationId: string,
        @Param('userId') userId: string,
        @Body() body: { name: string; level?: string; category?: string },
    ) {
        return this.directoryService.addSkillToUser(
            associationId, userId, body.name, body.level, body.category,
        );
    }

    // ── Remove skill ──
    @Delete('skills/user/:userId/:skillId')
    @Permissions('members.edit')
    removeSkill(
        @GetUser('associationId') associationId: string,
        @Param('userId') userId: string,
        @Param('skillId') skillId: string,
    ) {
        return this.directoryService.removeSkillFromUser(associationId, userId, skillId);
    }
}
