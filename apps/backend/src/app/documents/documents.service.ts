import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
    constructor(private prisma: PrismaService) { }

    // ── UPLOAD DOCUMENT ──
    async create(
        associationId: string,
        file: Express.Multer.File,
        category: string,
        eventId?: string,
    ) {
        const fileUrl = `/uploads/${file.filename}`;

        return this.prisma.document.create({
            data: {
                associationId,
                name: file.originalname,
                file_url: fileUrl,
                category: category || 'OTHER',
                eventId: eventId || null,
            },
        });
    }

    // ── LIST ALL DOCUMENTS ──
    async findAll(associationId: string) {
        return this.prisma.document.findMany({
            where: { associationId },
            orderBy: { createdAt: 'desc' },
            include: {
                event: {
                    select: { id: true, title: true },
                },
            },
        });
    }

    // ── DELETE DOCUMENT ──
    async remove(associationId: string, documentId: string) {
        const doc = await this.prisma.document.findFirst({
            where: { id: documentId, associationId },
        });

        if (!doc) {
            throw new NotFoundException('Document non trouvé.');
        }

        await this.prisma.document.delete({ where: { id: documentId } });
        return { success: true };
    }
}
