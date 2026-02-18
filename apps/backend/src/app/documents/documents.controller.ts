import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post('upload')
    @Permissions('events.edit')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (_req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `${uniqueSuffix}${ext}`);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
        }),
    )
    upload(
        @GetUser('associationId') associationId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('category') category: string,
        @Body('eventId') eventId?: string,
    ) {
        return this.documentsService.create(associationId, file, category, eventId);
    }

    @Get()
    @Permissions('events.view')
    findAll(@GetUser('associationId') associationId: string) {
        return this.documentsService.findAll(associationId);
    }

    @Delete(':id')
    @Permissions('events.edit')
    remove(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.documentsService.remove(associationId, id);
    }
}
