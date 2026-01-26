import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async findAll(associationId: string) {
        return this.prisma.event.findMany({
            where: { associationId },
            include: {
                _count: {
                    select: { registrations: true },
                },
            },
            orderBy: { start_date: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.event.findUnique({
            where: { id },
            include: {
                documents: true,
                registrations: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async create(associationId: string, dto: CreateEventDto) {
        if (!associationId) {
            throw new Error('Association ID is required to create an event.');
        }
        console.log('Creating event:', { associationId, dto });

        try {
            const startDate = new Date(dto.startDate);
            if (isNaN(startDate.getTime())) {
                throw new Error('Invalid start date format.');
            }

            return await this.prisma.event.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    location: dto.location,
                    start_date: startDate,
                    end_date: dto.endDate ? new Date(dto.endDate) : null,
                    is_paid: dto.isPaid ?? false,
                    price: dto.price ?? 0,
                    associationId,
                },
            });
        } catch (error) {
            console.error('Prisma Create Event Error:', error);
            throw error;
        }
    }

    async simulateConvocation(eventId: string) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { association: true },
        });

        if (!event) throw new Error('Event not found');

        const activeMembers = await this.prisma.user.count({
            where: {
                associationId: event.associationId,
                status: 'ACTIVE',
            },
        });

        // Simulate delay for email sending
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
            success: true,
            count: activeMembers,
            message: `${activeMembers} convocations envoyées par simulation.`,
        };
    }
}
