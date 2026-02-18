import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    // ── CREATE EVENT ──
    async create(associationId: string, dto: CreateEventDto) {
        return this.prisma.event.create({
            data: {
                associationId,
                title: dto.title,
                description: dto.description || null,
                location: dto.location || null,
                start_date: new Date(dto.start_date),
                end_date: dto.end_date ? new Date(dto.end_date) : null,
                type: dto.type || 'MEETING',
            },
        });
    }

    // ── LIST EVENTS (future first, then past) ──
    async findAll(associationId: string) {
        const events = await this.prisma.event.findMany({
            where: { associationId },
            orderBy: { start_date: 'asc' },
            include: {
                registrations: {
                    select: { status: true },
                },
                _count: {
                    select: { documents: true },
                },
            },
        });

        return events.map((e) => {
            const attending = e.registrations.filter((r) => r.status === 'ATTENDING').length;
            const absent = e.registrations.filter((r) => r.status === 'ABSENT').length;
            return {
                id: e.id,
                title: e.title,
                description: e.description,
                location: e.location,
                start_date: e.start_date,
                end_date: e.end_date,
                type: e.type,
                createdAt: e.createdAt,
                attending,
                absent,
                totalRegistrations: e.registrations.length,
                documentsCount: e._count.documents,
            };
        });
    }

    // ── GET EVENT DETAIL ──
    async findOne(associationId: string, eventId: string) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, associationId },
            include: {
                registrations: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar_url: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                documents: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!event) {
            throw new NotFoundException('Événement non trouvé.');
        }

        return event;
    }

    // ── REGISTER / UPDATE RSVP ──
    async register(associationId: string, eventId: string, userId: string, status: string) {
        // Verify the event belongs to this association
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, associationId },
        });

        if (!event) {
            throw new NotFoundException('Événement non trouvé.');
        }

        // Upsert: create or update registration
        const registration = await this.prisma.eventRegistration.upsert({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
            create: {
                eventId,
                userId,
                status: status || 'ATTENDING',
            },
            update: {
                status: status || 'ATTENDING',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return registration;
    }
}
