/* ─── Shared labels and constants for the directory feature ─── */

export const PRO_STATUS_LABELS: Record<string, string> = {
    STUDENT: "🎓 Étudiant(e)",
    EMPLOYED: "💼 Salarié(e)",
    SELF_EMPLOYED: "🏢 Indépendant(e)",
    CIVIL_SERVANT: "🏛️ Fonctionnaire",
    RETIRED: "🌴 Retraité(e)",
    UNEMPLOYED: "🔍 En recherche",
};

export const SECTOR_LABELS: Record<string, string> = {
    HEALTH: "🏥 Santé",
    TECH: "💻 Tech & IT",
    CONSTRUCTION: "🏗️ BTP",
    EDUCATION: "📚 Éducation",
    COMMERCE: "🛒 Commerce",
    AGRICULTURE: "🌾 Agriculture",
    LEGAL: "⚖️ Droit",
    FINANCE: "🏦 Finance",
    TRANSPORT: "🚛 Transport",
    ARTS: "🎨 Arts & Culture",
    OTHER: "🌐 Autre",
};

export const EDUCATION_LABELS: Record<string, string> = {
    NONE: "Aucun diplôme",
    BAC: "Baccalauréat",
    VOCATIONAL: "Formation pro",
    LICENCE: "Licence / Bachelor",
    MASTER: "Master",
    DOCTORATE: "Doctorat",
};

export const SKILL_CATEGORY_COLORS: Record<string, string> = {
    TECHNICAL: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    LANGUAGE: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    SOFT_SKILL: "bg-pink-500/15 text-pink-400 border-pink-500/25",
    TRADE: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    OTHER: "bg-gray-500/15 text-gray-400 border-gray-500/25",
};

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
    TECHNICAL: "Technique",
    LANGUAGE: "Langue",
    SOFT_SKILL: "Soft skill",
    TRADE: "Métier",
    OTHER: "Autre",
};

export const CHART_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b",
    "#10b981", "#06b6d4", "#3b82f6", "#d946ef", "#84cc16", "#ef4444",
];

/* ─── Types ─── */
export interface DirectorySkill {
    id: string;
    name: string;
    category: string | null;
    level?: string | null;
}

export interface DirectoryMember {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    residence_city: string | null;
    residence_country: string | null;
    professionalStatus: string | null;
    jobTitle: string | null;
    industrySector: string | null;
    employer: string | null;
    educationLevel: string | null;
    fieldOfStudy: string | null;
    availableForMentoring: boolean;
    skills: DirectorySkill[];
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

export interface DirectoryStats {
    totalActive: number;
    totalWithProfile: number;
    totalMentors: number;
    profileCompletionRate: number;
    sectorDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    topSkills: { name: string; category: string | null; memberCount: number }[];
}

/* ─── Helpers ─── */
export function memberName(m: { firstName: string | null; lastName: string | null; email: string }) {
    return [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
}

export function memberInitials(m: { firstName: string | null; lastName: string | null; email: string }) {
    return (m.firstName?.[0] || "") + (m.lastName?.[0] || m.email[0]);
}
