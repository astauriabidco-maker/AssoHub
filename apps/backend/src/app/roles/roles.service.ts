import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// All available permission keys
export const ALL_PERMISSIONS = [
    { key: 'dashboard.view', label: 'Tableau de bord', group: 'Navigation' },
    { key: 'members.view', label: 'Voir les membres', group: 'Membres' },
    { key: 'members.edit', label: 'Gérer les membres', group: 'Membres' },
    { key: 'groups.view', label: 'Voir les groupes', group: 'Groupes' },
    { key: 'groups.edit', label: 'Gérer les groupes', group: 'Groupes' },
    { key: 'finance.view', label: 'Voir les finances', group: 'Finances' },
    { key: 'finance.edit', label: 'Gérer les finances', group: 'Finances' },
    { key: 'events.view', label: 'Voir les événements', group: 'Événements' },
    { key: 'events.edit', label: 'Gérer les événements', group: 'Événements' },
    { key: 'settings.manage', label: 'Paramètres', group: 'Administration' },
    { key: 'roles.manage', label: 'Gérer les rôles', group: 'Administration' },
];

// Default roles seeded on association creation
const DEFAULT_ROLES = [
    {
        name: 'Administrateur',
        slug: 'ADMIN',
        color: '#8b5cf6',
        isSystem: true,
        permissions: ALL_PERMISSIONS.map((p) => p.key),
    },
    {
        name: 'Président',
        slug: 'PRESIDENT',
        color: '#10b981',
        isSystem: true,
        permissions: [
            'dashboard.view', 'members.view', 'members.edit',
            'groups.view', 'groups.edit', 'finance.view', 'finance.edit',
            'events.view', 'events.edit', 'settings.manage',
        ],
    },
    {
        name: 'Trésorier',
        slug: 'TREASURER',
        color: '#f59e0b',
        isSystem: false,
        permissions: [
            'dashboard.view', 'finance.view', 'finance.edit',
            'members.view', 'events.view', 'groups.view',
        ],
    },
    {
        name: 'Secrétaire',
        slug: 'SECRETARY',
        color: '#06b6d4',
        isSystem: false,
        permissions: [
            'dashboard.view', 'members.view', 'members.edit',
            'groups.view', 'groups.edit', 'events.view', 'events.edit',
        ],
    },
    {
        name: 'Membre',
        slug: 'MEMBER',
        color: '#3b82f6',
        isSystem: true,
        permissions: ['dashboard.view', 'groups.view', 'events.view'],
    },
];

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Seed default roles for a new association (called from AuthService)
     */
    async seedDefaultRoles(associationId: string) {
        for (const role of DEFAULT_ROLES) {
            await this.prisma.role.create({
                data: {
                    associationId,
                    name: role.name,
                    slug: role.slug,
                    color: role.color,
                    isSystem: role.isSystem,
                    permissions: JSON.stringify(role.permissions),
                },
            });
        }
    }

    /**
     * Get all roles for an association
     */
    async findAll(associationId: string) {
        const roles = await this.prisma.role.findMany({
            where: { associationId },
            orderBy: { createdAt: 'asc' },
        });

        return roles.map((r) => ({
            ...r,
            permissions: JSON.parse(r.permissions),
        }));
    }

    /**
     * Get permissions for a specific role slug within an association
     */
    async getPermissionsForRole(associationId: string, roleSlug: string): Promise<string[]> {
        const role = await this.prisma.role.findUnique({
            where: { slug_associationId: { slug: roleSlug, associationId } },
        });

        if (!role) {
            // Fallback: if role not found, return minimal permissions
            return ['dashboard.view'];
        }

        return JSON.parse(role.permissions);
    }

    /**
     * Create a new role
     */
    async create(associationId: string, dto: { name: string; slug: string; color?: string; permissions: string[] }) {
        const existing = await this.prisma.role.findUnique({
            where: { slug_associationId: { slug: dto.slug.toUpperCase(), associationId } },
        });

        if (existing) {
            throw new ConflictException('Un rôle avec ce slug existe déjà.');
        }

        const role = await this.prisma.role.create({
            data: {
                associationId,
                name: dto.name,
                slug: dto.slug.toUpperCase(),
                color: dto.color || '#6366f1',
                permissions: JSON.stringify(dto.permissions || []),
                isSystem: false,
            },
        });

        return { ...role, permissions: JSON.parse(role.permissions) };
    }

    /**
     * Update a role
     */
    async update(associationId: string, id: string, dto: { name?: string; color?: string; permissions?: string[] }) {
        const role = await this.prisma.role.findFirst({
            where: { id, associationId },
        });

        if (!role) {
            throw new NotFoundException('Rôle non trouvé.');
        }

        const data: Record<string, unknown> = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.color !== undefined) data.color = dto.color;
        if (dto.permissions !== undefined) data.permissions = JSON.stringify(dto.permissions);

        const updated = await this.prisma.role.update({
            where: { id },
            data,
        });

        return { ...updated, permissions: JSON.parse(updated.permissions) };
    }

    /**
     * Delete a role (non-system only)
     */
    async remove(associationId: string, id: string) {
        const role = await this.prisma.role.findFirst({
            where: { id, associationId },
        });

        if (!role) {
            throw new NotFoundException('Rôle non trouvé.');
        }

        if (role.isSystem) {
            throw new ForbiddenException('Les rôles système ne peuvent pas être supprimés.');
        }

        // Reassign users with this role to MEMBER
        await this.prisma.user.updateMany({
            where: { role: role.slug, associationId },
            data: { role: 'MEMBER' },
        });

        return this.prisma.role.delete({ where: { id } });
    }

    /**
     * Return the full list of available permissions
     */
    getAvailablePermissions() {
        return ALL_PERMISSIONS;
    }
}
