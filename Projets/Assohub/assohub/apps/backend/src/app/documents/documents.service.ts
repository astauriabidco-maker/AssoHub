import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(associationId: string, category?: string) {
        return this.prisma.document.findMany({
            where: {
                associationId,
                ...(category ? { category: category as any } : {}),
            },
            include: { event: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(associationId: string, dto: CreateDocumentDto, filePath: string) {
        return this.prisma.document.create({
            data: {
                name: dto.name,
                category: dto.category,
                file_path: filePath,
                associationId,
                eventId: dto.eventId || null,
                access_level: dto.accessLevel || 'ADMIN_ONLY',
            },
        });
    }

    async remove(id: string) {
        return this.prisma.document.delete({ where: { id } });
    }
}
