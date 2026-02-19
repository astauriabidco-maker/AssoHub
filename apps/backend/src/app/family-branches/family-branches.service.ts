import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamilyBranchesService {
    constructor(private prisma: PrismaService) { }

    async create(
        associationId: string,
        dto: { name: string; founderName?: string; description?: string },
    ) {
        return this.prisma.familyBranch.create({
            data: {
                associationId,
                name: dto.name,
                founderName: dto.founderName || null,
                description: dto.description || null,
            },
            include: {
                _count: { select: { members: true } },
            },
        });
    }

    async findAll(associationId: string) {
        return this.prisma.familyBranch.findMany({
            where: { associationId },
            include: {
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async remove(associationId: string, id: string) {
        const branch = await this.prisma.familyBranch.findFirst({
            where: { id, associationId },
        });
        if (!branch) throw new NotFoundException('Branche introuvable.');

        // Reset familyBranchId for members of this branch
        await this.prisma.user.updateMany({
            where: { familyBranchId: id },
            data: { familyBranchId: null },
        });

        return this.prisma.familyBranch.delete({ where: { id } });
    }
}
