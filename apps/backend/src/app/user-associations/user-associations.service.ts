import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserAssociationsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Attach a member to a secondary association (antenne)
     */
    async attach(dto: { userId: string; associationId: string; role?: string }, requestorAssociationId: string) {
        // Verify target association is a child of the requestor's association
        const targetAssociation = await this.prisma.association.findUnique({
            where: { id: dto.associationId },
        });
        if (!targetAssociation) {
            throw new NotFoundException('Association cible introuvable.');
        }
        if (targetAssociation.parentId !== requestorAssociationId && targetAssociation.id !== requestorAssociationId) {
            throw new ForbiddenException("Vous ne pouvez rattacher un membre qu'à vos propres antennes.");
        }

        // Verify user exists and belongs to the requestor's association
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        // Prevent attaching to own primary association
        if (user.associationId === dto.associationId) {
            throw new ConflictException('Ce membre appartient déjà à cette association en tant que membre principal.');
        }

        // Check for duplicate
        const existing = await this.prisma.userAssociation.findUnique({
            where: {
                userId_associationId: {
                    userId: dto.userId,
                    associationId: dto.associationId,
                },
            },
        });
        if (existing) {
            throw new ConflictException('Ce membre est déjà rattaché à cette antenne.');
        }

        return this.prisma.userAssociation.create({
            data: {
                userId: dto.userId,
                associationId: dto.associationId,
                role: dto.role || 'MEMBER',
            },
            include: {
                user: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        email: true, role: true, avatar_url: true,
                    },
                },
                association: {
                    select: { id: true, name: true, address_city: true },
                },
            },
        });
    }

    /**
     * Detach a member from a secondary association
     */
    async detach(id: string) {
        const record = await this.prisma.userAssociation.findUnique({
            where: { id },
        });
        if (!record) {
            throw new NotFoundException('Rattachement introuvable.');
        }
        return this.prisma.userAssociation.delete({ where: { id } });
    }

    /**
     * List secondary members of an association (antenne)
     */
    async findByAssociation(associationId: string) {
        return this.prisma.userAssociation.findMany({
            where: { associationId },
            include: {
                user: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        email: true, role: true, avatar_url: true,
                        phone: true, residence_city: true, residence_country: true,
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
    }

    /**
     * List associations (antennes) a user is secondarily attached to
     */
    async findByUser(userId: string) {
        return this.prisma.userAssociation.findMany({
            where: { userId },
            include: {
                association: {
                    select: {
                        id: true, name: true, address_city: true,
                        networkLevel: true, is_active: true,
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
    }
}
