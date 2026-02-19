import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private rolesService: RolesService,
    ) { }

    /**
     * Generate a URL-safe slug from association name
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    async register(dto: RegisterDto) {
        // 1. Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà.');
        }

        // 2. Generate unique slug
        let slug = this.generateSlug(dto.associationName);
        const existingSlug = await this.prisma.association.findUnique({
            where: { slug },
        });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const associationType = dto.associationType || 'OTHER';

        // 4. Transaction: Create Association + Admin User
        const result = await this.prisma.$transaction(async (tx) => {
            const association = await tx.association.create({
                data: {
                    name: dto.associationName,
                    slug,
                    type: associationType,
                    // Contextual fields for FAMILY type
                    ...(associationType === 'FAMILY' ? {
                        origin_village: dto.originVillage || null,
                        origin_region: dto.originRegion || null,
                        chieftaincy: dto.chieftaincy || null,
                    } : {}),
                },
            });

            const user = await tx.user.create({
                data: {
                    associationId: association.id,
                    email: dto.email,
                    password_hash: passwordHash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                },
            });

            // Create initial family branches if FAMILY type
            if (associationType === 'FAMILY' && dto.branches && dto.branches.length > 0) {
                for (const branch of dto.branches) {
                    await tx.familyBranch.create({
                        data: {
                            associationId: association.id,
                            name: branch.name,
                            founderName: branch.founderName || null,
                        },
                    });
                }
            }

            return { association, user };
        });

        // 5. Seed default roles adapted to association type
        await this.rolesService.seedDefaultRoles(result.association.id, associationType);

        // 6. Get permissions for the ADMIN role
        const permissions = await this.rolesService.getPermissionsForRole(
            result.association.id,
            result.user.role,
        );

        // 7. Generate JWT
        const payload = {
            sub: result.user.id,
            email: result.user.email,
            associationId: result.association.id,
            role: result.user.role,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                role: result.user.role,
                permissions,
            },
            association: {
                id: result.association.id,
                name: result.association.name,
                slug: result.association.slug,
                type: result.association.type,
            },
        };
    }

    async login(dto: LoginDto) {
        // 1. Find user
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
            include: { association: true },
        });

        if (!user) {
            throw new UnauthorizedException('Identifiants invalides.');
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Identifiants invalides.');
        }

        // 3. Get permissions for the user's role
        const permissions = await this.rolesService.getPermissionsForRole(
            user.associationId,
            user.role,
        );

        // 4. Generate JWT
        const payload = {
            sub: user.id,
            email: user.email,
            associationId: user.associationId,
            role: user.role,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                permissions,
            },
            association: {
                id: user.association.id,
                name: user.association.name,
                slug: user.association.slug,
                type: user.association.type,
            },
        };
    }
}
