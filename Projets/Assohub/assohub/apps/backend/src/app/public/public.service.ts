import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinAssociationDto } from './dto/join-association.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    async getAssociationBySlug(slug: string) {
        const association = await this.prisma.association.findFirst({
            where: { slug, is_active: true },
            select: {
                id: true,
                name: true,
                slug: true,
                slogan: true,
                description: true,
                logo_url: true,
                address_street: true,
                address_city: true,
                address_zip: true,
                contact_email: true,
                contact_phone: true,
                events: {
                    where: {
                        start_date: { gte: new Date() },
                    },
                    select: {
                        id: true,
                        title: true,
                        start_date: true,
                        location: true,
                    },
                    orderBy: { start_date: 'asc' },
                    take: 5,
                },
            },
        });

        if (!association) {
            throw new NotFoundException('Association non trouvée');
        }

        return association;
    }

    async joinAssociation(slug: string, dto: JoinAssociationDto) {
        const association = await this.prisma.association.findFirst({
            where: { slug, is_active: true },
        });

        if (!association) {
            throw new NotFoundException('Association non trouvée');
        }

        // Check if user already exists in this association
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                associationId: association.id,
            },
        });

        if (existingUser) {
            throw new NotFoundException('Un compte existe déjà avec cet email');
        }

        // Create user with PENDING status and a temporary password hash
        const tempPasswordHash = await bcrypt.hash(Math.random().toString(36), 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                password_hash: tempPasswordHash,
                associationId: association.id,
                status: 'PENDING',
                role: 'MEMBER',
            },
        });

        return {
            success: true,
            message: 'Votre demande a été envoyée au bureau de l\'association.',
            userId: user.id,
        };
    }
}
