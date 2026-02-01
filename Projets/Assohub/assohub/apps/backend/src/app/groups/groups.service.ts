import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/groups.dto';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async findAll(associationId: string) {
        return this.prisma.group.findMany({
            where: { associationId },
            include: {
                leader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(associationId: string, id: string) {
        const group = await this.prisma.group.findFirst({
            where: { id, associationId },
            include: {
                leader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!group) {
            throw new NotFoundException('Groupe non trouvé.');
        }

        return group;
    }

    async create(associationId: string, dto: CreateGroupDto) {
        return this.prisma.group.create({
            data: {
                ...dto,
                associationId,
            },
            include: {
                leader: true,
                _count: { select: { members: true } },
            },
        });
    }

    async update(associationId: string, id: string, dto: UpdateGroupDto) {
        const group = await this.findOne(associationId, id);

        return this.prisma.group.update({
            where: { id },
            data: dto,
        });
    }

    async remove(associationId: string, id: string) {
        await this.findOne(associationId, id);

        return this.prisma.group.delete({
            where: { id },
        });
    }

    async addMember(associationId: string, groupId: string, userId: string) {
        // Verify group exists
        await this.findOne(associationId, groupId);

        // Verify user belongs to association
        const user = await this.prisma.user.findFirst({
            where: { id: userId, associationId },
        });

        if (!user) {
            throw new BadRequestException('Utilisateur non trouvé dans cette association.');
        }

        // Check if already member
        const group = await this.prisma.group.findFirst({
            where: { id: groupId },
            include: { members: { where: { id: userId } } },
        });

        if (group?.members.length) {
            throw new BadRequestException('Cet utilisateur est déjà membre du groupe.');
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: {
                members: { connect: { id: userId } },
            },
            include: {
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async removeMember(associationId: string, groupId: string, userId: string) {
        await this.findOne(associationId, groupId);

        return this.prisma.group.update({
            where: { id: groupId },
            data: {
                members: { disconnect: { id: userId } },
            },
        });
    }

    async setLeader(associationId: string, groupId: string, userId: string) {
        await this.findOne(associationId, groupId);

        // Verify user belongs to association
        const user = await this.prisma.user.findFirst({
            where: { id: userId, associationId },
        });

        if (!user) {
            throw new BadRequestException('Utilisateur non trouvé dans cette association.');
        }

        // Also add as member if not already
        const group = await this.prisma.group.findFirst({
            where: { id: groupId },
            include: { members: { where: { id: userId } } },
        });

        const updateData: any = { leaderId: userId };
        if (!group?.members.length) {
            updateData.members = { connect: { id: userId } };
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: updateData,
            include: {
                leader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }
}
