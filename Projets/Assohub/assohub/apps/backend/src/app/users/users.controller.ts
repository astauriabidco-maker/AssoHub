import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll(@GetUser('associationId') associationId: string) {
        return this.usersService.findAll(associationId);
    }

    @Get(':id')
    findOne(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.usersService.findOne(associationId, id);
    }

    @Post()
    create(
        @GetUser('associationId') associationId: string,
        @Body() createUserDto: CreateUserDto,
    ) {
        return this.usersService.create(associationId, createUserDto);
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importCsv(
        @GetUser('associationId') associationId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni.');
        }

        const csvContent = file.buffer.toString('utf-8');
        return this.usersService.importFromCsv(associationId, csvContent);
    }

    @Patch(':id')
    update(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(associationId, id, updateUserDto);
    }

    @Patch(':id/status')
    updateStatus(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateStatusDto,
    ) {
        return this.usersService.updateStatus(associationId, id, updateStatusDto);
    }

    @Delete(':id')
    remove(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.usersService.remove(associationId, id);
    }
}
