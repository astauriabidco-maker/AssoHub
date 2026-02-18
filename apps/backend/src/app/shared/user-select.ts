/**
 * Shared User select / utilities used by both UsersService and DirectoryService.
 * Avoids duplication between the two modules that query the same User table.
 */

import { BadRequestException } from '@nestjs/common';

// ─── Base select (used by members CRUD) ──
export const USER_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    role: true,
    status: true,
    gender: true,
    isVirtual: true,
    residence_city: true,
    residence_country: true,
    family_branch: true,
    birth_date: true,
    membership_date: true,
    professionalStatus: true,
    jobTitle: true,
    industrySector: true,
    employer: true,
    educationLevel: true,
    fieldOfStudy: true,
    availableForMentoring: true,
    profileVisibility: true,
    createdAt: true,
} as const;

// ─── Extended select for directory (adds skills relation) ──
export const DIRECTORY_USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    residence_city: true,
    residence_country: true,
    professionalStatus: true,
    jobTitle: true,
    industrySector: true,
    employer: true,
    educationLevel: true,
    fieldOfStudy: true,
    availableForMentoring: true,
    skills: {
        include: {
            skill: { select: { id: true, name: true, category: true } },
        },
    },
} as const;

// ─── Enum whitelists ──
export const VALID_PRO_STATUS = ['STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'CIVIL_SERVANT', 'RETIRED', 'UNEMPLOYED'] as const;
export const VALID_SECTOR = ['HEALTH', 'TECH', 'CONSTRUCTION', 'EDUCATION', 'COMMERCE', 'AGRICULTURE', 'LEGAL', 'FINANCE', 'TRANSPORT', 'ARTS', 'OTHER'] as const;
export const VALID_EDUCATION = ['NONE', 'BAC', 'VOCATIONAL', 'LICENCE', 'MASTER', 'DOCTORATE'] as const;
export const VALID_VISIBILITY = ['PRIVATE', 'MEMBERS', 'PUBLIC'] as const;
export const VALID_SKILL_CATEGORY = ['TECHNICAL', 'LANGUAGE', 'SOFT_SKILL', 'TRADE', 'OTHER'] as const;

/**
 * Validates that a value is in an allowed enum list.
 * Throws BadRequestException with a descriptive message if invalid.
 */
export function validateEnum(value: string | undefined, allowed: readonly string[], label: string): void {
    if (value && !allowed.includes(value)) {
        throw new BadRequestException(
            `Valeur invalide pour ${label}: "${value}". Valeurs autorisées: ${allowed.join(', ')}`,
        );
    }
}

/**
 * Flatten the Prisma UserSkill include into a clean array.
 */
export function flattenSkills(user: Record<string, unknown>) {
    const skills = user.skills as { skill: { id: string; name: string; category: string | null }; level: string | null }[];
    return {
        ...user,
        skills: skills.map((us) => ({
            id: us.skill.id,
            name: us.skill.name,
            category: us.skill.category,
            level: us.level,
        })),
    };
}

/**
 * Standard paginated response shape.
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}
