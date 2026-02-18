import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_SELECT, PaginatedResult } from '../shared/user-select';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Find a single user by id + associationId.
     * Shared helper — used by both UsersService and DirectoryService.
     * Throws NotFoundException if not found.
     */
    async findById(associationId: string, id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });
        if (!user) throw new NotFoundException('Utilisateur non trouvé.');
        return user;
    }

    /**
     * List all members of an association with pagination.
     */
    async findAll(
        associationId: string,
        page = 1,
        limit = 50,
    ): Promise<PaginatedResult<typeof USER_SELECT>> {
        const skip = (page - 1) * limit;
        const where = { associationId };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: USER_SELECT,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users as unknown as (typeof USER_SELECT)[],
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
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

        // Random temporary password (virtual users won't log in)
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                role: dto.role || 'MEMBER',
                status: dto.isVirtual ? 'ACTIVE' : 'ACTIVE',
                gender: dto.gender || null,
                isVirtual: dto.isVirtual || false,
                associationId,
                password_hash: passwordHash,
                residence_city: dto.residence_city,
                residence_country: dto.residence_country,
                family_branch: dto.family_branch,
                birth_date: dto.birth_date ? new Date(dto.birth_date) : null,
                membership_date: dto.membership_date ? new Date(dto.membership_date) : null,
            },
            select: USER_SELECT,
        });

        // Auto-create family links if parentIds or spouseId provided
        if (dto.parentIds && dto.parentIds.length > 0) {
            for (const parentId of dto.parentIds) {
                await this.prisma.familyLink.create({
                    data: {
                        associationId,
                        fromUserId: parentId,
                        toUserId: user.id,
                        relationType: 'PARENT',
                    },
                }).catch(() => {
                    // Ignore duplicate links silently
                });
            }
        }

        if (dto.spouseId) {
            await this.prisma.familyLink.create({
                data: {
                    associationId,
                    fromUserId: user.id,
                    toUserId: dto.spouseId,
                    relationType: 'SPOUSE',
                },
            }).catch(() => {
                // Ignore duplicate links silently
            });
        }

        return user;
    }

    async updateStatus(
        associationId: string,
        id: string,
        status: 'ACTIVE' | 'SUSPENDED',
    ) {
        await this.findById(associationId, id);

        return this.prisma.user.update({
            where: { id },
            data: { status },
            select: USER_SELECT,
        });
    }

    async update(associationId: string, id: string, dto: UpdateUserDto) {
        await this.findById(associationId, id);

        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: USER_SELECT,
        });
    }

    async remove(associationId: string, id: string) {
        await this.findById(associationId, id);

        return this.prisma.user.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
    }
}
