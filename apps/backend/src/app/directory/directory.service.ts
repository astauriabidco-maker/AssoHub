import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
    DIRECTORY_USER_SELECT,
    VALID_PRO_STATUS,
    VALID_SECTOR,
    VALID_EDUCATION,
    VALID_VISIBILITY,
    VALID_SKILL_CATEGORY,
    validateEnum,
    flattenSkills,
} from '../shared/user-select';

interface DirectoryFilters {
    search?: string;
    industrySector?: string;
    professionalStatus?: string;
    educationLevel?: string;
    availableForMentoring?: boolean;
    city?: string;
    skillName?: string;
}

@Injectable()
export class DirectoryService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
    ) { }

    // ── Recherche à facettes (paginée) ──
    async searchDirectory(associationId: string, filters: DirectoryFilters, page = 1, limit = 12) {
        // Validate enums
        validateEnum(filters.industrySector, VALID_SECTOR, 'secteur');
        validateEnum(filters.professionalStatus, VALID_PRO_STATUS, 'statut professionnel');
        validateEnum(filters.educationLevel, VALID_EDUCATION, 'niveau études');

        const where: Record<string, unknown> = {
            associationId,
            isVirtual: false,
            status: 'ACTIVE',
            profileVisibility: { in: ['MEMBERS', 'PUBLIC'] },
        };

        if (filters.industrySector) where.industrySector = filters.industrySector;
        if (filters.professionalStatus) where.professionalStatus = filters.professionalStatus;
        if (filters.educationLevel) where.educationLevel = filters.educationLevel;
        if (filters.availableForMentoring !== undefined) where.availableForMentoring = filters.availableForMentoring;
        if (filters.city) where.residence_city = { contains: filters.city };
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search } },
                { lastName: { contains: filters.search } },
                { jobTitle: { contains: filters.search } },
                { employer: { contains: filters.search } },
                { fieldOfStudy: { contains: filters.search } },
            ];
        }

        // Skill filter
        if (filters.skillName) {
            const skillUsers = await this.prisma.userSkill.findMany({
                where: {
                    skill: {
                        name: { contains: filters.skillName },
                        associationId,
                    },
                },
                select: { userId: true },
            });
            where.id = { in: skillUsers.map((s) => s.userId) };
        }

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: DIRECTORY_USER_SELECT,
                orderBy: { lastName: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(flattenSkills),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ── Dashboard stats ──
    async getDirectoryStats(associationId: string) {
        const users = await this.prisma.user.findMany({
            where: { associationId, isVirtual: false, status: 'ACTIVE' },
            select: {
                professionalStatus: true,
                industrySector: true,
                educationLevel: true,
                availableForMentoring: true,
            },
        });

        const totalActive = users.length;
        const totalWithProfile = users.filter(
            (u) => u.professionalStatus || u.industrySector || u.educationLevel,
        ).length;
        const totalMentors = users.filter((u) => u.availableForMentoring).length;

        const sectorCounts: Record<string, number> = {};
        const educationCounts: Record<string, number> = {};
        const statusCounts: Record<string, number> = {};

        for (const u of users) {
            if (u.industrySector) sectorCounts[u.industrySector] = (sectorCounts[u.industrySector] || 0) + 1;
            if (u.educationLevel) educationCounts[u.educationLevel] = (educationCounts[u.educationLevel] || 0) + 1;
            if (u.professionalStatus) statusCounts[u.professionalStatus] = (statusCounts[u.professionalStatus] || 0) + 1;
        }

        const topSkills = await this.prisma.skill.findMany({
            where: { associationId },
            select: {
                name: true,
                category: true,
                _count: { select: { users: true } },
            },
            orderBy: { users: { _count: 'desc' } },
            take: 15,
        });

        return {
            totalActive,
            totalWithProfile,
            totalMentors,
            profileCompletionRate: totalActive > 0 ? Math.round((totalWithProfile / totalActive) * 100) : 0,
            sectorDistribution: sectorCounts,
            educationDistribution: educationCounts,
            statusDistribution: statusCounts,
            topSkills: topSkills.map((s) => ({
                name: s.name,
                category: s.category,
                memberCount: s._count.users,
            })),
        };
    }

    // ── Mentors (paginés) ──
    async getMentors(associationId: string, page = 1, limit = 12) {
        const where = {
            associationId,
            isVirtual: false,
            status: 'ACTIVE' as const,
            availableForMentoring: true,
            profileVisibility: { in: ['MEMBERS', 'PUBLIC'] },
        };

        const skip = (page - 1) * limit;
        const [mentors, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: DIRECTORY_USER_SELECT,
                orderBy: { lastName: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: mentors.map(flattenSkills),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ── Export CSV ──
    async exportDirectory(associationId: string, filters: DirectoryFilters) {
        const where: Record<string, unknown> = {
            associationId,
            isVirtual: false,
            status: 'ACTIVE',
        };

        if (filters.industrySector) where.industrySector = filters.industrySector;
        if (filters.professionalStatus) where.professionalStatus = filters.professionalStatus;
        if (filters.educationLevel) where.educationLevel = filters.educationLevel;
        if (filters.availableForMentoring !== undefined) where.availableForMentoring = filters.availableForMentoring;

        const users = await this.prisma.user.findMany({
            where,
            select: {
                ...DIRECTORY_USER_SELECT,
                profileVisibility: true,
            },
            orderBy: { lastName: 'asc' },
        });

        const header = 'Prénom,Nom,Email,Téléphone,Ville,Pays,Statut Pro,Métier,Secteur,Employeur,Niveau Études,Domaine Études,Mentor,Compétences';
        const escape = (v: string | null | undefined) => {
            if (!v) return '';
            const s = v.replace(/"/g, '""');
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
        };

        const rows = users.map((u) => {
            const skills = (u.skills as { skill: { name: string } }[]).map((us) => us.skill.name).join('; ');
            return [
                escape(u.firstName), escape(u.lastName), escape(u.email), escape(u.phone),
                escape(u.residence_city), escape(u.residence_country),
                escape(u.professionalStatus), escape(u.jobTitle), escape(u.industrySector),
                escape(u.employer), escape(u.educationLevel), escape(u.fieldOfStudy),
                u.availableForMentoring ? 'Oui' : 'Non',
                escape(skills),
            ].join(',');
        });

        return [header, ...rows].join('\n');
    }

    // ── Auto-complétion compétences ──
    async suggestSkills(associationId: string, query: string) {
        if (!query || query.length < 2) return [];

        return this.prisma.skill.findMany({
            where: {
                associationId,
                name: { contains: query },
            },
            select: { id: true, name: true, category: true },
            orderBy: { name: 'asc' },
            take: 10,
        });
    }

    // ── Get single user profile ──
    async getProfile(associationId: string, userId: string) {
        // Shared findById to ensure existence + params
        const user = await this.usersService.findById(associationId, userId);
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            residence_city: user.residence_city,
            residence_country: user.residence_country,
            professionalStatus: user.professionalStatus,
            jobTitle: user.jobTitle,
            industrySector: user.industrySector,
            employer: user.employer,
            educationLevel: user.educationLevel,
            fieldOfStudy: user.fieldOfStudy,
            availableForMentoring: user.availableForMentoring,
            profileVisibility: user.profileVisibility,
            role: user.role,
            createdAt: user.createdAt,
        };
    }

    // ── Update professional profile ──
    async updateProfessionalProfile(
        associationId: string,
        userId: string,
        data: {
            professionalStatus?: string;
            jobTitle?: string;
            industrySector?: string;
            employer?: string;
            educationLevel?: string;
            fieldOfStudy?: string;
            availableForMentoring?: boolean;
            profileVisibility?: string;
        },
    ) {
        // Validate enums
        validateEnum(data.professionalStatus, VALID_PRO_STATUS, 'statut professionnel');
        validateEnum(data.industrySector, VALID_SECTOR, 'secteur');
        validateEnum(data.educationLevel, VALID_EDUCATION, 'niveau études');
        validateEnum(data.profileVisibility, VALID_VISIBILITY, 'visibilité');

        // Use shared findById — ensures user exists + same association
        await this.usersService.findById(associationId, userId);

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                professionalStatus: data.professionalStatus,
                jobTitle: data.jobTitle,
                industrySector: data.industrySector,
                employer: data.employer,
                educationLevel: data.educationLevel,
                fieldOfStudy: data.fieldOfStudy,
                availableForMentoring: data.availableForMentoring,
                profileVisibility: data.profileVisibility,
            },
            select: {
                id: true,
                professionalStatus: true,
                jobTitle: true,
                industrySector: true,
                employer: true,
                educationLevel: true,
                fieldOfStudy: true,
                availableForMentoring: true,
                profileVisibility: true,
            },
        });
    }

    // ── Add skill to user ──
    async addSkillToUser(
        associationId: string,
        userId: string,
        skillName: string,
        level?: string,
        category?: string,
    ) {
        validateEnum(category, VALID_SKILL_CATEGORY, 'catégorie compétence');

        // Use shared findById
        await this.usersService.findById(associationId, userId);

        let skill = await this.prisma.skill.findFirst({
            where: { name: skillName, associationId },
        });
        if (!skill) {
            skill = await this.prisma.skill.create({
                data: { name: skillName, associationId, category: category || null },
            });
        }

        await this.prisma.userSkill.upsert({
            where: {
                userId_skillId: { userId, skillId: skill.id },
            },
            create: { userId, skillId: skill.id, level: level || null },
            update: { level: level || undefined },
        });

        return this.getUserSkills(associationId, userId);
    }

    // ── Remove skill from user ──
    async removeSkillFromUser(associationId: string, userId: string, skillId: string) {
        // Use shared findById
        await this.usersService.findById(associationId, userId);

        await this.prisma.userSkill.deleteMany({
            where: { userId, skillId },
        });

        return this.getUserSkills(associationId, userId);
    }

    // ── Get user skills ──
    async getUserSkills(associationId: string, userId: string) {
        const skills = await this.prisma.userSkill.findMany({
            where: {
                userId,
                skill: { associationId },
            },
            include: {
                skill: { select: { id: true, name: true, category: true } },
            },
        });

        return skills.map((us) => ({
            id: us.skill.id,
            name: us.skill.name,
            category: us.skill.category,
            level: us.level,
        }));
    }

    // ── Get all skills of the association ──
    async getSkills(associationId: string) {
        return this.prisma.skill.findMany({
            where: { associationId },
            select: {
                id: true,
                name: true,
                category: true,
                _count: { select: { users: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
}
