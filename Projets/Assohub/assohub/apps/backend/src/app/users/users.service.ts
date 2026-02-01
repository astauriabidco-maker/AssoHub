import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import * as bcrypt from 'bcrypt';
import * as Papa from 'papaparse';
import { Role, UserStatus } from '@prisma/client';

interface CsvRow {
    email: string;
    firstName?: string;
    lastName?: string;
    firstname?: string;
    lastname?: string;
    role?: string;
}

const ROLE_MAP: Record<string, Role> = {
    'SUPER_ADMIN': 'SUPER_ADMIN',
    'ADMIN': 'ADMIN',
    'PRESIDENT': 'PRESIDENT',
    'VICE_PRESIDENT': 'VICE_PRESIDENT',
    'SECRETARY': 'SECRETARY',
    'TREASURER': 'TREASURER',
    'MEMBER': 'MEMBER',
};

const ROLE_LABELS: Record<Role, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Administrateur',
    'PRESIDENT': 'Président',
    'VICE_PRESIDENT': 'Vice-Président',
    'SECRETARY': 'Secrétaire',
    'TREASURER': 'Trésorier',
    'MEMBER': 'Membre',
};

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(associationId: string) {
        return this.prisma.user.findMany({
            where: {
                associationId,
                status: { not: 'INACTIVE' },
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

    async findOne(associationId: string, id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
            include: {
                fees: {
                    include: {
                        campaign: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                history: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        const { password_hash, ...result } = user;
        return result;
    }

    async create(associationId: string, dto: CreateUserDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                associationId,
            },
        });

        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà dans votre association.');
        }

        const defaultPassword = 'ChangeMe123!';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                ...dto,
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
            },
        });

        // Create history entry
        await this.prisma.memberHistory.create({
            data: {
                userId: user.id,
                action: 'CREATED',
                description: 'Membre créé manuellement',
            },
        });

        return user;
    }

    async update(associationId: string, id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        // Track role change for history
        const roleChanged = dto.role && dto.role !== user.role;
        const oldRole = user.role;

        const updatedUser = await this.prisma.user.update({
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

        // Create history if role changed
        if (roleChanged && dto.role) {
            await this.prisma.memberHistory.create({
                data: {
                    userId: id,
                    action: 'ROLE_CHANGED',
                    description: `Rôle changé de ${ROLE_LABELS[oldRole]} à ${ROLE_LABELS[dto.role]}`,
                },
            });
        }

        return updatedUser;
    }

    async updateStatus(associationId: string, id: string, dto: UpdateStatusDto) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        if (user.status === dto.status) {
            return user;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { status: dto.status as UserStatus },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
            },
        });

        // Create history entry
        const action = dto.status === 'SUSPENDED' ? 'SUSPENDED' : 'REACTIVATED';
        const description = dto.status === 'SUSPENDED'
            ? 'Membre suspendu'
            : 'Membre réactivé';

        await this.prisma.memberHistory.create({
            data: {
                userId: id,
                action,
                description,
            },
        });

        return updatedUser;
    }

    async importFromCsv(associationId: string, csvContent: string) {
        const parsed = Papa.parse<CsvRow>(csvContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase(),
        });

        if (parsed.errors.length > 0) {
            throw new BadRequestException('Erreur lors du parsing du CSV: ' + parsed.errors[0]?.message);
        }

        const rows = parsed.data;
        if (rows.length === 0) {
            throw new BadRequestException('Le fichier CSV est vide.');
        }

        const defaultPassword = 'ChangeMe123!';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        let importedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
            if (!row.email) continue;

            const email = row.email.trim().toLowerCase();

            // Check if user already exists
            const existing = await this.prisma.user.findFirst({
                where: { email, associationId },
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            // Parse role
            const roleKey = (row.role || 'MEMBER').toUpperCase().trim();
            const role: Role = ROLE_MAP[roleKey] || 'MEMBER';

            // Create user
            const user = await this.prisma.user.create({
                data: {
                    associationId,
                    email,
                    password_hash: passwordHash,
                    firstName: row.firstname?.trim() || row.firstName?.trim() || null,
                    lastName: row.lastname?.trim() || row.lastName?.trim() || null,
                    role,
                    status: 'ACTIVE',
                },
            });

            // Create history entry
            await this.prisma.memberHistory.create({
                data: {
                    userId: user.id,
                    action: 'IMPORTED',
                    description: 'Importé via CSV',
                },
            });

            importedCount++;
        }

        return {
            imported: importedCount,
            skipped: skippedCount,
            total: rows.length,
        };
    }

    async remove(associationId: string, id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé.');
        }

        await this.prisma.memberHistory.create({
            data: {
                userId: id,
                action: 'DELETED',
                description: 'Membre supprimé (désactivé)',
            },
        });

        return this.prisma.user.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
    }
}
