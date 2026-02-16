import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(associationId: string) {
        return this.prisma.user.findMany({
            where: { associationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(associationId: string, dto: CreateUserDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email, associationId },
        });

        if (existingUser) {
            throw new ConflictException(
                'Un utilisateur avec cet email existe déjà dans votre association.',
            );
        }

        // Random temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        return this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role || 'MEMBER',
                status: 'ACTIVE',
                associationId,
                password_hash: passwordHash,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async updateStatus(
        associationId: string,
        id: string,
        status: 'ACTIVE' | 'SUSPENDED',
    ) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        return this.prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async update(associationId: string, id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
            },
        });
    }

    async remove(associationId: string, id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        return this.prisma.user.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
    }
}
