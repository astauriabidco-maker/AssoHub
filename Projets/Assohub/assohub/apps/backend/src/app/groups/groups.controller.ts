import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto, SetLeaderDto } from './dto/groups.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    @Get()
    findAll(@GetUser('associationId') associationId: string) {
        return this.groupsService.findAll(associationId);
    }

    @Get(':id')
    findOne(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.groupsService.findOne(associationId, id);
    }

    @Post()
    create(
        @GetUser('associationId') associationId: string,
        @Body() createGroupDto: CreateGroupDto,
    ) {
        return this.groupsService.create(associationId, createGroupDto);
    }

    @Patch(':id')
    update(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() updateGroupDto: UpdateGroupDto,
    ) {
        return this.groupsService.update(associationId, id, updateGroupDto);
    }

    @Delete(':id')
    remove(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.groupsService.remove(associationId, id);
    }

    @Post(':id/members')
    addMember(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() dto: AddMemberDto,
    ) {
        return this.groupsService.addMember(associationId, id, dto.userId);
    }

    @Delete(':id/members/:userId')
    removeMember(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Param('userId') userId: string,
    ) {
        return this.groupsService.removeMember(associationId, id, userId);
    }

    @Patch(':id/leader')
    setLeader(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() dto: SetLeaderDto,
    ) {
        return this.groupsService.setLeader(associationId, id, dto.userId);
    }
}
