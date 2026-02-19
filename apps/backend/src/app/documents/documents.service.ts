import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DocumentsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    // ── UPLOAD DOCUMENT ──
    // ── UPLOAD DOCUMENT ──
    async create(
        associationId: string,
        file: Express.Multer.File,
        category: string,
        eventId?: string,
        groupId?: string,
    ) {
        const fileUrl = `/uploads/${file.filename}`;

        const doc = await this.prisma.document.create({
            data: {
                associationId,
                name: file.originalname,
                file_url: fileUrl,
                category: category || 'OTHER',
                eventId: eventId || null,
                groupId: groupId || null,
            },
        });

        // Notify group members
        if (groupId) {
            const group = await this.prisma.group.findUnique({
                where: { id: groupId },
                include: { members: { select: { id: true } } },
            });
            if (group) {
                for (const member of group.members) {
                    await this.notificationsService.notify(member.id, {
                        title: `Nouveau document : ${file.originalname}`,
                        message: `Un nouveau document a été ajouté à la commission "${group.name}".`,
                        type: 'DOCUMENT',
                        link: `/dashboard/groups?id=${group.id}`,
                    });
                }
            }
        }

        return doc;
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
                group: {
                    select: { id: true, name: true },
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
