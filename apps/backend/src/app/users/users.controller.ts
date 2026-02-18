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
} from '@nestjs/common';
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
}
