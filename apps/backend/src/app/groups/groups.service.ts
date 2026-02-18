import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    // ── CREATE GROUP ──
    async create(associationId: string, dto: CreateGroupDto) {
        // Validate leader belongs to this association
        if (dto.leaderId) {
            const leader = await this.prisma.user.findFirst({
                where: { id: dto.leaderId, associationId },
            });
            if (!leader) {
                throw new BadRequestException('Le responsable sélectionné n\'appartient pas à cette association.');
            }
        }

        // Validate member IDs belong to this association
        if (dto.memberIds?.length) {
            const validMembers = await this.prisma.user.findMany({
                where: { id: { in: dto.memberIds }, associationId },
                select: { id: true },
            });
            if (validMembers.length !== dto.memberIds.length) {
                throw new BadRequestException('Certains membres sélectionnés n\'appartiennent pas à cette association.');
            }
        }

        return this.prisma.group.create({
            data: {
                associationId,
                name: dto.name,
                description: dto.description || null,
                leaderId: dto.leaderId || null,
                members: dto.memberIds?.length
                    ? { connect: dto.memberIds.map((id) => ({ id })) }
                    : undefined,
            },
            include: {
                leader: { select: { id: true, firstName: true, lastName: true, email: true } },
                members: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    // ── LIST ALL GROUPS ──
    async findAll(associationId: string) {
        return this.prisma.group.findMany({
            where: { associationId },
            orderBy: { createdAt: 'desc' },
            include: {
                leader: { select: { id: true, firstName: true, lastName: true, email: true } },
                _count: { select: { members: true } },
            },
        });
    }

    // ── GET ONE GROUP ──
    async findOne(associationId: string, groupId: string) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
            include: {
                leader: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        status: true,
                        residence_city: true,
                        residence_country: true,
                    },
                },
            },
        });

        if (!group) {
            throw new NotFoundException('Groupe non trouvé.');
        }

        return group;
    }

    // ── UPDATE GROUP ──
    async update(associationId: string, groupId: string, dto: CreateGroupDto) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
        });

        if (!group) {
            throw new NotFoundException('Groupe non trouvé.');
        }

        // Validate leader
        if (dto.leaderId) {
            const leader = await this.prisma.user.findFirst({
                where: { id: dto.leaderId, associationId },
            });
            if (!leader) {
                throw new BadRequestException('Le responsable sélectionné n\'appartient pas à cette association.');
            }
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: {
                name: dto.name,
                description: dto.description || null,
                leaderId: dto.leaderId || null,
                members: dto.memberIds
                    ? { set: dto.memberIds.map((id) => ({ id })) }
                    : undefined,
            },
            include: {
                leader: { select: { id: true, firstName: true, lastName: true, email: true } },
                members: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    // ── DELETE GROUP ──
    async remove(associationId: string, groupId: string) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
        });

        if (!group) {
            throw new NotFoundException('Groupe non trouvé.');
        }

        await this.prisma.group.delete({ where: { id: groupId } });
        return { success: true };
    }

    // ── ADD MEMBERS TO GROUP ──
    async addMembers(associationId: string, groupId: string, memberIds: string[]) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
        });
        if (!group) throw new NotFoundException('Groupe non trouvé.');

        const validMembers = await this.prisma.user.findMany({
            where: { id: { in: memberIds }, associationId },
            select: { id: true },
        });
        if (validMembers.length !== memberIds.length) {
            throw new BadRequestException('Certains membres n\'appartiennent pas à cette association.');
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: {
                members: { connect: memberIds.map((id) => ({ id })) },
            },
            include: {
                members: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    // ── REMOVE MEMBER FROM GROUP ──
    async removeMember(associationId: string, groupId: string, memberId: string) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
        });
        if (!group) throw new NotFoundException('Groupe non trouvé.');

        return this.prisma.group.update({
            where: { id: groupId },
            data: {
                members: { disconnect: { id: memberId } },
            },
            include: {
                members: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
}
