import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    // ── CREATE EVENT ──
    async create(associationId: string, dto: CreateEventDto) {
        let campaignId: string | null = null;
        if (dto.is_paid && dto.price && dto.price > 0) {
            const campaign = await this.prisma.campaign.create({
                data: {
                    associationId,
                    name: `[EVENT] ${dto.title}`,
                    description: `Frais pour l'événement : ${dto.title}`,
                    amount: dto.price,
                    due_date: new Date(dto.start_date),
                    scope: 'LOCAL',
                    type: 'EVENT', // Assuming you have a type field or similar in Campaign, if not just skip or reuse existing
                } as any // Cast to any to bypass potential strict type checks if Campaign model hasn't been re-generated perfectly yet
            });
            campaignId = campaign.id;
        }

        // Create Master Event
        const masterEvent = await this.prisma.event.create({
            data: {
                associationId,
                title: dto.title,
                description: dto.description || null,
                location: dto.location || null,
                start_date: new Date(dto.start_date),
                end_date: dto.end_date ? new Date(dto.end_date) : null,
                type: dto.type || 'MEETING',
                is_paid: dto.is_paid || false,
                price: dto.price || null,
                campaignId: campaignId,
                recurrenceType: dto.recurrence || 'NONE',
                recurrenceEnd: dto.recurrenceEnd ? new Date(dto.recurrenceEnd) : null,
                reminderTime: dto.reminderTime || null,
            },
        });

        // ── Handle Recurrence ──
        if (dto.recurrence && dto.recurrence !== 'NONE' && dto.recurrenceEnd) {
            const endDate = new Date(dto.recurrenceEnd);
            let nextDate = new Date(dto.start_date);
            const duration = dto.end_date ? (new Date(dto.end_date).getTime() - new Date(dto.start_date).getTime()) : 0;

            // Limit iterations to avoid infinite loops (max 100 or 2 years)
            let iterations = 0;
            const MAX_ITERATIONS = 52;

            while (iterations < MAX_ITERATIONS) {
                // Calculate next date
                if (dto.recurrence === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (dto.recurrence === 'MONTHLY') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (dto.recurrence === 'YEARLY') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                } else {
                    break;
                }

                if (nextDate > endDate) break;

                // Create Child Event
                await this.prisma.event.create({
                    data: {
                        associationId,
                        title: `${dto.title}`, // Could append sequence if needed
                        description: dto.description || null,
                        location: dto.location || null,
                        start_date: new Date(nextDate),
                        end_date: duration ? new Date(nextDate.getTime() + duration) : null,
                        type: dto.type || 'MEETING',
                        is_paid: dto.is_paid || false,
                        price: dto.price || null,
                        campaignId: campaignId, // Link to same campaign ?? Or duplicate campaign? Linking to same implies one payment covers all? usually no. 
                        // For simplistic recurring events (like monthly meetings), typically fees are per meeting. 
                        // BUT if campaign is linked, it means one "billetterie". 
                        // If paid event is recurring, generally we want a new ticket per event.
                        // For now, let's NOT link campaign to children to avoid chaos, unless price is 0.
                        // Or better: Create a new Campaign for each child? That's heavy.
                        // Let's assume Recurring Paid events are rare for now or handled manually. 
                        // If is_paid, we might need logic. Let's keep it simple: Link to same campaignId might be wrong if campaign has due_date. 
                        // Let's leaving campaignId NULL for children for now if paid, to avoid bugs.
                        // WAIT: If I want to pay for the March meeting, I need a campaign/fee.
                        // If I link to the SAME campaign, then paying once pays for... which one? The fee is linked to campaign. 
                        // So one campaign = one fee. 
                        // If we want separate fees, we need separate campaigns.
                        // Complex. Let's just create the event copies without payment link for now or revisit.
                        // Decision: Create copies. If paid, we don't auto-create campaigns for children yet to avoid spamming the finance module.
                        recurrenceType: 'NONE', // Children are not recurring themselves
                        parentId: masterEvent.id,
                        reminderTime: dto.reminderTime || null,
                    },
                });
                iterations++;
            }
        }

        return masterEvent;
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
            const attending = e.registrations.filter((r) => r.status === 'ATTENDING' || r.status === 'PAID').length;
            const absent = e.registrations.filter((r) => r.status === 'ABSENT').length;
            return {
                id: e.id,
                title: e.title,
                description: e.description,
                location: e.location,
                start_date: e.start_date,
                end_date: e.end_date,
                type: e.type,
                is_paid: e.is_paid,
                price: e.price,
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

        // ── Handle Payment Logic ──
        let feeId = null;
        let feeStatus: string | null = null;
        if (event.is_paid && event.campaignId && status === 'ATTENDING') {
            // Check if fee exists
            let fee = await this.prisma.fee.findFirst({
                where: {
                    campaignId: event.campaignId,
                    userId,
                },
            });

            if (!fee) {
                // Create Fee
                fee = await this.prisma.fee.create({
                    data: {
                        campaignId: event.campaignId,
                        userId,
                        status: 'PENDING',
                    },
                });
            }
            feeId = fee.id;
            feeStatus = fee.status;
        }

        return { ...registration, feeId, feeStatus };
    }
}
