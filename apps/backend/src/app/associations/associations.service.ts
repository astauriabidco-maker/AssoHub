import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { CreateChildDto } from './dto/create-child.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AssociationsService {
    constructor(
        private prisma: PrismaService,
        private rolesService: RolesService,
    ) { }

    async findOne(associationId: string) {
        const association = await this.prisma.association.findUnique({
            where: { id: associationId },
            include: {
                parent: { select: { id: true, name: true, networkLevel: true } },
                children: {
                    select: {
                        id: true, name: true, address_city: true,
                        networkLevel: true, is_active: true, createdAt: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!association) {
            throw new NotFoundException('Association introuvable.');
        }

        return association;
    }

    async update(associationId: string, userRole: string, dto: UpdateAssociationDto) {
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Seul un administrateur peut modifier les paramètres.');
        }

        const association = await this.prisma.association.findUnique({
            where: { id: associationId },
        });

        if (!association) {
            throw new NotFoundException('Association introuvable.');
        }

        return this.prisma.association.update({
            where: { id: associationId },
            data: dto,
        });
    }

    // ── Réseau : vue hiérarchique ──
    async getNetwork(associationId: string) {
        const association = await this.prisma.association.findUnique({
            where: { id: associationId },
            include: {
                parent: { select: { id: true, name: true, networkLevel: true } },
                children: {
                    select: {
                        id: true, name: true, address_city: true,
                        networkLevel: true, is_active: true, createdAt: true,
                        _count: { select: { users: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!association) {
            throw new NotFoundException('Association introuvable.');
        }

        return association;
    }

    // ── Créer une antenne (sous-association) ──
    async createChild(parentAssociationId: string, dto: CreateChildDto) {
        // Check parent exists
        const parent = await this.prisma.association.findUnique({
            where: { id: parentAssociationId },
        });
        if (!parent) {
            throw new NotFoundException('Association parente introuvable.');
        }

        // Check admin email not already used
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.adminEmail },
        });
        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà.');
        }

        // Generate slug
        let slug = dto.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const existingSlug = await this.prisma.association.findUnique({
            where: { slug },
        });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // Generate temp password
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Transaction: create association + admin user
        const result = await this.prisma.$transaction(async (tx) => {
            const child = await tx.association.create({
                data: {
                    name: dto.name,
                    slug,
                    parentId: parentAssociationId,
                    address_city: dto.address_city || null,
                    networkLevel: dto.networkLevel || 'LOCAL',
                },
            });

            const user = await tx.user.create({
                data: {
                    associationId: child.id,
                    email: dto.adminEmail,
                    password_hash: passwordHash,
                    firstName: dto.adminFirstName,
                    lastName: dto.adminLastName,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                },
            });

            return { child, user };
        });

        // Seed default roles for the new child association
        await this.rolesService.seedDefaultRoles(result.child.id);

        return {
            ...result.child,
            admin: {
                email: result.user.email,
                tempPassword,
            },
        };
    }

    // ── Stats réseau consolidées ──
    async getNetworkStats(associationId: string) {
        const association = await this.prisma.association.findUnique({
            where: { id: associationId },
            include: {
                children: {
                    select: {
                        id: true, name: true, address_city: true,
                        networkLevel: true, is_active: true,
                    },
                },
            },
        });

        if (!association) {
            throw new NotFoundException('Association introuvable.');
        }

        // Get stats for each child
        const childIds = association.children.map((c) => c.id);
        const allIds = [associationId, ...childIds];

        const [memberCounts, feeTotals, eventCounts] = await Promise.all([
            // Members per association
            this.prisma.user.groupBy({
                by: ['associationId'],
                where: { associationId: { in: allIds }, status: 'ACTIVE' },
                _count: { id: true },
            }),
            // Finance per association
            this.prisma.fee.findMany({
                where: { campaign: { associationId: { in: allIds } } },
                select: {
                    status: true,
                    campaign: { select: { associationId: true, amount: true } },
                },
            }),
            // Events per association
            this.prisma.event.groupBy({
                by: ['associationId'],
                where: { associationId: { in: allIds } },
                _count: { id: true },
            }),
        ]);

        // Build lookup maps
        const memberMap = new Map<string, number>();
        memberCounts.forEach((m) => memberMap.set(m.associationId, m._count.id));

        const financeMap = new Map<string, { expected: number; collected: number }>();
        feeTotals.forEach((f) => {
            const aId = f.campaign.associationId;
            if (!financeMap.has(aId)) financeMap.set(aId, { expected: 0, collected: 0 });
            const entry = financeMap.get(aId)!;
            entry.expected += f.campaign.amount;
            if (f.status === 'PAID') entry.collected += f.campaign.amount;
        });

        const eventMap = new Map<string, number>();
        eventCounts.forEach((e) => eventMap.set(e.associationId, e._count.id));

        // Assemble per-child stats
        const childrenStats = association.children.map((child) => ({
            id: child.id,
            name: child.name,
            address_city: child.address_city,
            networkLevel: child.networkLevel,
            is_active: child.is_active,
            members: memberMap.get(child.id) || 0,
            finance: financeMap.get(child.id) || { expected: 0, collected: 0 },
            events: eventMap.get(child.id) || 0,
        }));

        // Totals
        const totalMembers = allIds.reduce((s, id) => s + (memberMap.get(id) || 0), 0);
        const totalExpected = allIds.reduce((s, id) => s + (financeMap.get(id)?.expected || 0), 0);
        const totalCollected = allIds.reduce((s, id) => s + (financeMap.get(id)?.collected || 0), 0);
        const totalEvents = allIds.reduce((s, id) => s + (eventMap.get(id) || 0), 0);

        return {
            totals: {
                associations: allIds.length,
                members: totalMembers,
                expected: totalExpected,
                collected: totalCollected,
                events: totalEvents,
            },
            self: {
                members: memberMap.get(associationId) || 0,
                finance: financeMap.get(associationId) || { expected: 0, collected: 0 },
                events: eventMap.get(associationId) || 0,
            },
            children: childrenStats,
        };
    }

    // ── Stats pour le dashboard principal ──
    async getDashboardStats(associationId: string) {
        const [memberCount, financeStats, eventCount, childCount] = await Promise.all([
            this.prisma.user.count({
                where: { associationId, status: 'ACTIVE' },
            }),
            this.prisma.fee.findMany({
                where: { campaign: { associationId } },
                select: {
                    status: true,
                    campaign: { select: { amount: true } },
                },
            }),
            this.prisma.event.count({
                where: { associationId },
            }),
            this.prisma.association.count({
                where: { parentId: associationId },
            }),
        ]);

        let totalExpected = 0;
        let totalCollected = 0;
        financeStats.forEach((f) => {
            totalExpected += f.campaign.amount;
            if (f.status === 'PAID') totalCollected += f.campaign.amount;
        });

        return {
            members: memberCount,
            balance: totalCollected,
            expected: totalExpected,
            events: eventCount,
            children: childCount,
        };
    }
}
