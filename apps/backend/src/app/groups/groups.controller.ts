import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    // ── Créer un groupe ──
    @Post()
    @Permissions('groups.edit')
    create(
        @GetUser('associationId') associationId: string,
        @Body() dto: CreateGroupDto,
    ) {
        return this.groupsService.create(associationId, dto);
    }

    // ── Liste des groupes ──
    @Get()
    @Permissions('groups.view')
    findAll(@GetUser('associationId') associationId: string) {
        return this.groupsService.findAll(associationId);
    }

    // ── Détail d'un groupe ──
    @Get(':id')
    @Permissions('groups.view')
    findOne(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.groupsService.findOne(associationId, id);
    }

    // ── Modifier un groupe ──
    @Patch(':id')
    @Permissions('groups.edit')
    update(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() dto: CreateGroupDto,
    ) {
        return this.groupsService.update(associationId, id, dto);
    }

    // ── Supprimer un groupe ──
    @Delete(':id')
    @Permissions('groups.delete')
    remove(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.groupsService.remove(associationId, id);
    }

    // ── Ajouter des membres ──
    @Post(':id/members')
    @Permissions('groups.edit')
    addMembers(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() body: { memberIds: string[] },
    ) {
        return this.groupsService.addMembers(associationId, id, body.memberIds);
    }

    // ── Retirer un membre ──
    @Delete(':id/members/:memberId')
    @Permissions('groups.edit')
    removeMember(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Param('memberId') memberId: string,
    ) {
        return this.groupsService.removeMember(associationId, id, memberId);
    }
    // ── OBJECTIFS ──

    @Post(':id/objectives')
    @Permissions('groups.edit')
    addObjective(
        @GetUser('associationId') associationId: string,
        @Param('id') groupId: string,
        @Body() dto: CreateObjectiveDto,
    ) {
        return this.groupsService.addObjective(associationId, groupId, dto);
    }

    @Get(':id/objectives')
    @Permissions('groups.view')
    getObjectives(
        @GetUser('associationId') associationId: string,
        @Param('id') groupId: string,
    ) {
        return this.groupsService.getObjectives(associationId, groupId);
    }

    @Patch(':id/objectives/:objId')
    @Permissions('groups.edit')
    updateObjective(
        @GetUser('associationId') associationId: string,
        @Param('id') groupId: string, // Not strictly used by service but good for REST structure
        @Param('objId') objId: string,
        @Body() dto: UpdateObjectiveDto,
    ) {
        return this.groupsService.updateObjective(associationId, objId, dto);
    }

    @Delete(':id/objectives/:objId')
    @Permissions('groups.edit')
    deleteObjective(
        @GetUser('associationId') associationId: string,
        @Param('id') groupId: string,
        @Param('objId') objId: string,
    ) {
        return this.groupsService.deleteObjective(associationId, objId);
    }
}
