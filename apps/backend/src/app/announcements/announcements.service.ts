import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
    constructor(private prisma: PrismaService) { }

    // Create an announcement (LOCAL or NETWORK scope)
    async create(
        associationId: string,
        authorId: string,
        data: { title: string; content: string; scope?: string },
    ) {
        // Only allow NETWORK scope if association has children
        if (data.scope === 'NETWORK') {
            const childCount = await this.prisma.association.count({
                where: { parentId: associationId },
            });
            if (childCount === 0) {
                throw new ForbiddenException(
                    'Seule une association avec des antennes peut diffuser en mode NETWORK.',
                );
            }
        }

        return this.prisma.announcement.create({
            data: {
                associationId,
                authorId,
                title: data.title,
                content: data.content,
                scope: data.scope || 'LOCAL',
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    // Get announcements: local + network from parent (if child)
    async findAll(associationId: string) {
        // 1. Get local announcements
        const localAnnouncements = await this.prisma.announcement.findMany({
            where: { associationId },
            include: {
                author: { select: { id: true, firstName: true, lastName: true } },
                association: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        // 2. Get network announcements from parent (if applicable)
        const association = await this.prisma.association.findUnique({
            where: { id: associationId },
            select: { parentId: true },
        });

        let networkAnnouncements: typeof localAnnouncements = [];
        if (association?.parentId) {
            networkAnnouncements = await this.prisma.announcement.findMany({
                where: {
                    associationId: association.parentId,
                    scope: 'NETWORK',
                },
                include: {
                    author: { select: { id: true, firstName: true, lastName: true } },
                    association: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
        }

        // 3. Merge and sort by date
        const all = [...localAnnouncements, ...networkAnnouncements].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        return all;
    }

    // Delete an announcement
    async delete(id: string, associationId: string) {
        const announcement = await this.prisma.announcement.findFirst({
            where: { id },
        });

        if (!announcement || announcement.associationId !== associationId) {
            throw new NotFoundException('Annonce introuvable.');
        }

        await this.prisma.announcement.delete({ where: { id } });
        return { deleted: true };
    }
}
