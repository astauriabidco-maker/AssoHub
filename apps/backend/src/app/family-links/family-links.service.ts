import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamilyLinksService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a family link between two members
     */
    async createLink(
        associationId: string,
        fromUserId: string,
        toUserId: string,
        relationType: 'PARENT' | 'SPOUSE',
    ) {
        // Verify both users exist and belong to the same association
        const [fromUser, toUser] = await Promise.all([
            this.prisma.user.findFirst({ where: { id: fromUserId, associationId } }),
            this.prisma.user.findFirst({ where: { id: toUserId, associationId } }),
        ]);

        if (!fromUser) throw new NotFoundException(`Membre source introuvable.`);
        if (!toUser) throw new NotFoundException(`Membre cible introuvable.`);

        // Prevent self-link
        if (fromUserId === toUserId) {
            throw new ConflictException(`Un membre ne peut pas être lié à lui-même.`);
        }

        // Check for duplicate
        const existing = await this.prisma.familyLink.findUnique({
            where: {
                fromUserId_toUserId_relationType: {
                    fromUserId,
                    toUserId,
                    relationType,
                },
            },
        });
        if (existing) {
            throw new ConflictException(`Ce lien familial existe déjà.`);
        }

        return this.prisma.familyLink.create({
            data: {
                associationId,
                fromUserId,
                toUserId,
                relationType,
            },
            include: {
                fromUser: {
                    select: { id: true, firstName: true, lastName: true, gender: true },
                },
                toUser: {
                    select: { id: true, firstName: true, lastName: true, gender: true },
                },
            },
        });
    }

    /**
     * Remove a family link
     */
    async removeLink(associationId: string, linkId: string) {
        const link = await this.prisma.familyLink.findFirst({
            where: { id: linkId, associationId },
        });
        if (!link) throw new NotFoundException(`Lien familial introuvable.`);

        return this.prisma.familyLink.delete({ where: { id: linkId } });
    }

    /**
     * Get all links for a specific user
     */
    async getLinksForUser(associationId: string, userId: string) {
        const links = await this.prisma.familyLink.findMany({
            where: {
                associationId,
                OR: [{ fromUserId: userId }, { toUserId: userId }],
            },
            include: {
                fromUser: {
                    select: { id: true, firstName: true, lastName: true, gender: true, avatar_url: true },
                },
                toUser: {
                    select: { id: true, firstName: true, lastName: true, gender: true, avatar_url: true },
                },
            },
        });

        // Compute resolved relationships from user perspective
        return links.map((link) => {
            const isFrom = link.fromUserId === userId;
            let resolvedType: string;

            if (link.relationType === 'PARENT') {
                resolvedType = isFrom ? 'PARENT' : 'CHILD';
            } else {
                resolvedType = 'SPOUSE';
            }

            return {
                id: link.id,
                relationType: link.relationType,
                resolvedType,
                relatedUser: isFrom ? link.toUser : link.fromUser,
            };
        });
    }

    /**
     * Get the full family tree data for the association
     * Returns all members + all links, ready for frontend rendering
     */
    async getTree(associationId: string) {
        const [members, links] = await Promise.all([
            this.prisma.user.findMany({
                where: { associationId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    gender: true,
                    isVirtual: true,
                    avatar_url: true,
                    birth_date: true,
                    role: true,
                    status: true,
                    family_branch: true,
                },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.familyLink.findMany({
                where: { associationId },
                select: {
                    id: true,
                    fromUserId: true,
                    toUserId: true,
                    relationType: true,
                },
            }),
        ]);

        return { members, links };
    }
}
