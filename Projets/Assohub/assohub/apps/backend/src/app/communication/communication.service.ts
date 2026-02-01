import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class CommunicationService {
    constructor(private prisma: PrismaService) { }

    async createAnnouncement(
        associationId: string,
        authorId: string,
        dto: CreateAnnouncementDto,
    ) {
        return this.prisma.announcement.create({
            data: {
                title: dto.title,
                content: dto.content,
                associationId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async getAnnouncements(associationId: string) {
        return this.prisma.announcement.findMany({
            where: { associationId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
}
