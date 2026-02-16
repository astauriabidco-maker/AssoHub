import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No permissions required → allow
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Accès non autorisé.');
        }

        // Look up the user's role in the DB to get their permissions
        const role = await this.prisma.role.findFirst({
            where: {
                slug: user.role,
                associationId: user.associationId,
            },
        });

        if (!role) {
            throw new ForbiddenException('Rôle non trouvé. Accès refusé.');
        }

        const userPermissions: string[] = JSON.parse(role.permissions);

        // Check that user has ALL required permissions
        const hasAllPermissions = requiredPermissions.every((p) =>
            userPermissions.includes(p),
        );

        if (!hasAllPermissions) {
            throw new ForbiddenException('Permissions insuffisantes.');
        }

        return true;
    }
}
