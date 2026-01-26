import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAssociationDto } from './dto/update-association.dto';

@Injectable()
export class AssociationsService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        const association = await this.prisma.association.findUnique({
            where: { id },
            include: {
                users: {
                    where: {
                        role: { in: ['ADMIN', 'TREASURER'] },
                    },
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

        if (!association) {
            throw new NotFoundException('Association introuvable.');
        }

        return association;
    }

    async update(id: string, dto: UpdateAssociationDto) {
        return this.prisma.association.update({
            where: { id },
            data: dto,
        });
    }

    async toggleStatus(id: string) {
        const association = await this.findOne(id);
        return this.prisma.association.update({
            where: { id },
            data: { is_active: !association.is_active },
        });
    }
}
