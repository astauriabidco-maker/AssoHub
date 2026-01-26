import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Get()
    findAll(
        @GetUser('associationId') associationId: string,
        @Query('category') category: string
    ) {
        return this.documentsService.findAll(associationId, category);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    uploadFile(
        @GetUser('associationId') associationId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateDocumentDto
    ) {
        const filePath = `/uploads/${file.filename}`;
        return this.documentsService.create(associationId, dto, filePath);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.documentsService.remove(id);
    }
}
