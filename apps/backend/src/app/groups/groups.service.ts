import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GroupsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

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
                parentId: dto.parentId || null,
                scope: dto.scope || 'NATIONAL',
                attachedToId: dto.attachedToId || null,
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
                _count: { select: { members: true, documents: true } },
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
                parentId: dto.parentId,
                scope: dto.scope,
                attachedToId: dto.attachedToId,
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

        await this.prisma.group.update({
            where: { id: groupId },
            data: {
                members: { connect: memberIds.map((id) => ({ id })) },
            },
        });

        // Notify new members
        for (const memberId of memberIds) {
            await this.notificationsService.notify(memberId, {
                title: `Bienvenue dans la commission ${group.name}`,
                message: `Vous avez été ajouté à la commission "${group.name}".`,
                type: 'ASSIGNMENT',
                link: `/dashboard/groups?id=${group.id}`,
            });
        }

        return group;
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
    // ── OBJECTIVES ──

    async addObjective(associationId: string, groupId: string, dto: CreateObjectiveDto) {
        // verify group access
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
        });
        if (!group) throw new NotFoundException('Commission non trouvée.');

        const newObjective = await this.prisma.commissionObjective.create({
            data: {
                groupId,
                title: dto.title,
                description: dto.description || null,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                assignedToId: dto.assignedToId || null,
                status: dto.status || 'PENDING',
            },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        // Notify assigned user if any
        if (dto.assignedToId) {
            await this.notificationsService.notify(dto.assignedToId, {
                title: `Nouvel objectif assigné : ${dto.title}`,
                message: `Vous avez un nouvel objectif dans la commission "${group.name}" : ${dto.title}. Echéance : ${dto.dueDate ? new Date(dto.dueDate).toLocaleDateString() : 'Non définie'}`,
                type: 'OBJECTIVE',
                link: `/dashboard/groups?id=${group.id}`,
                sendEmail: true,
            });
        }

        return newObjective;
    }

    async getObjectives(associationId: string, groupId: string) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, associationId },
        });
        if (!group) throw new NotFoundException('Commission non trouvée.');

        return this.prisma.commissionObjective.findMany({
            where: { groupId },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { dueDate: 'asc' }, // soonest first
        });
    }

    async updateObjective(associationId: string, objectiveId: string, dto: UpdateObjectiveDto) {
        const obj = await this.prisma.commissionObjective.findUnique({
            where: { id: objectiveId },
            include: { group: true },
        });

        if (!obj || obj.group.associationId !== associationId) {
            throw new NotFoundException('Objectif introuvable.');
        }

        return this.prisma.commissionObjective.update({
            where: { id: objectiveId },
            data: {
                ...dto,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async deleteObjective(associationId: string, objectiveId: string) {
        const obj = await this.prisma.commissionObjective.findUnique({
            where: { id: objectiveId },
            include: { group: true },
        });

        if (!obj || obj.group.associationId !== associationId) {
            throw new NotFoundException('Objectif introuvable.');
        }

        return this.prisma.commissionObjective.delete({
            where: { id: objectiveId },
        });
    }
}
