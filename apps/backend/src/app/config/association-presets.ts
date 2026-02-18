/**
 * Association type presets — defines adaptive defaults for each association type
 */

export const ASSOCIATION_TYPES = [
    { value: 'FAMILY', label: 'Association Familiale', icon: '🏠', description: 'Famille, tribu, canton' },
    { value: 'CULTURAL', label: 'Association Culturelle', icon: '🎭', description: 'Art, culture, patrimoine' },
    { value: 'SPORTS', label: 'Association Sportive', icon: '⚽', description: 'Club sportif, ligue' },
    { value: 'POLITICAL', label: 'Association Politique', icon: '🏛️', description: 'Parti, mouvement citoyen' },
    { value: 'RELIGIOUS', label: 'Association Religieuse', icon: '🕊️', description: 'Église, mosquée, temple' },
    { value: 'OTHER', label: 'Autre', icon: '🌐', description: 'ONG, humanitaire, professionnelle' },
] as const;

export type AssociationType = typeof ASSOCIATION_TYPES[number]['value'];

// ─── Role presets per association type ────────────────────────────

interface RolePreset {
    name: string;
    slug: string;
    color: string;
    isSystem: boolean;
    permissions: string[];
}

const ALL_PERMS = [
    'dashboard.view', 'members.view', 'members.edit',
    'groups.view', 'groups.edit', 'finance.view', 'finance.edit',
    'events.view', 'events.edit', 'settings.manage', 'roles.manage',
];

const VIEW_PERMS = ['dashboard.view', 'groups.view', 'events.view'];

const MANAGEMENT_PERMS = [
    'dashboard.view', 'members.view', 'members.edit',
    'groups.view', 'groups.edit', 'finance.view', 'finance.edit',
    'events.view', 'events.edit', 'settings.manage',
];

// Common roles shared by all types
const COMMON_ROLES: RolePreset[] = [
    {
        name: 'Administrateur',
        slug: 'ADMIN',
        color: '#8b5cf6',
        isSystem: true,
        permissions: ALL_PERMS,
    },
    {
        name: 'Membre',
        slug: 'MEMBER',
        color: '#3b82f6',
        isSystem: true,
        permissions: VIEW_PERMS,
    },
];

// Type-specific additional roles
const TYPE_ROLES: Record<string, RolePreset[]> = {
    FAMILY: [
        {
            name: 'Chef de famille',
            slug: 'CHIEF',
            color: '#d97706',
            isSystem: false,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Notable',
            slug: 'NOTABLE',
            color: '#10b981',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view',
                'groups.view', 'finance.view',
                'events.view', 'events.edit',
            ],
        },
        {
            name: 'Doyen / Doyenne',
            slug: 'ELDER',
            color: '#f59e0b',
            isSystem: false,
            permissions: ['dashboard.view', 'members.view', 'groups.view', 'events.view'],
        },
        {
            name: 'Trésorier',
            slug: 'TREASURER',
            color: '#f59e0b',
            isSystem: false,
            permissions: [
                'dashboard.view', 'finance.view', 'finance.edit',
                'members.view', 'events.view', 'groups.view',
            ],
        },
        {
            name: 'Secrétaire',
            slug: 'SECRETARY',
            color: '#06b6d4',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view', 'members.edit',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
        {
            name: 'Commissaire aux comptes',
            slug: 'AUDITOR',
            color: '#ec4899',
            isSystem: false,
            permissions: ['dashboard.view', 'finance.view', 'members.view', 'events.view'],
        },
    ],
    CULTURAL: [
        {
            name: 'Président',
            slug: 'PRESIDENT',
            color: '#10b981',
            isSystem: true,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Coordinateur',
            slug: 'COORDINATOR',
            color: '#06b6d4',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
        {
            name: 'Trésorier',
            slug: 'TREASURER',
            color: '#f59e0b',
            isSystem: false,
            permissions: [
                'dashboard.view', 'finance.view', 'finance.edit',
                'members.view', 'events.view', 'groups.view',
            ],
        },
        {
            name: 'Secrétaire',
            slug: 'SECRETARY',
            color: '#06b6d4',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view', 'members.edit',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
    ],
    SPORTS: [
        {
            name: 'Président',
            slug: 'PRESIDENT',
            color: '#10b981',
            isSystem: true,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Coach / Entraîneur',
            slug: 'COACH',
            color: '#ef4444',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view', 'members.edit',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
        {
            name: 'Capitaine',
            slug: 'CAPTAIN',
            color: '#f59e0b',
            isSystem: false,
            permissions: ['dashboard.view', 'members.view', 'groups.view', 'events.view'],
        },
        {
            name: 'Trésorier',
            slug: 'TREASURER',
            color: '#f59e0b',
            isSystem: false,
            permissions: [
                'dashboard.view', 'finance.view', 'finance.edit',
                'members.view', 'events.view', 'groups.view',
            ],
        },
    ],
    POLITICAL: [
        {
            name: 'Président',
            slug: 'PRESIDENT',
            color: '#10b981',
            isSystem: true,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Secrétaire Général',
            slug: 'SECRETARY_GENERAL',
            color: '#06b6d4',
            isSystem: false,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Porte-parole',
            slug: 'SPOKESPERSON',
            color: '#8b5cf6',
            isSystem: false,
            permissions: ['dashboard.view', 'members.view', 'groups.view', 'events.view', 'events.edit'],
        },
        {
            name: 'Trésorier',
            slug: 'TREASURER',
            color: '#f59e0b',
            isSystem: false,
            permissions: [
                'dashboard.view', 'finance.view', 'finance.edit',
                'members.view', 'events.view', 'groups.view',
            ],
        },
        {
            name: 'Militant',
            slug: 'ACTIVIST',
            color: '#3b82f6',
            isSystem: false,
            permissions: VIEW_PERMS,
        },
    ],
    RELIGIOUS: [
        {
            name: 'Pasteur / Imam / Responsable',
            slug: 'PASTOR',
            color: '#10b981',
            isSystem: true,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Diacre / Responsable adjoint',
            slug: 'DEACON',
            color: '#8b5cf6',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view', 'members.edit',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
        {
            name: 'Trésorier',
            slug: 'TREASURER',
            color: '#f59e0b',
            isSystem: false,
            permissions: [
                'dashboard.view', 'finance.view', 'finance.edit',
                'members.view', 'events.view', 'groups.view',
            ],
        },
        {
            name: 'Secrétaire',
            slug: 'SECRETARY',
            color: '#06b6d4',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view', 'members.edit',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
    ],
    OTHER: [
        {
            name: 'Président',
            slug: 'PRESIDENT',
            color: '#10b981',
            isSystem: true,
            permissions: MANAGEMENT_PERMS,
        },
        {
            name: 'Trésorier',
            slug: 'TREASURER',
            color: '#f59e0b',
            isSystem: false,
            permissions: [
                'dashboard.view', 'finance.view', 'finance.edit',
                'members.view', 'events.view', 'groups.view',
            ],
        },
        {
            name: 'Secrétaire',
            slug: 'SECRETARY',
            color: '#06b6d4',
            isSystem: false,
            permissions: [
                'dashboard.view', 'members.view', 'members.edit',
                'groups.view', 'groups.edit', 'events.view', 'events.edit',
            ],
        },
    ],
};

/**
 * Get roles to seed for a given association type.
 * Always includes COMMON_ROLES + type-specific roles.
 */
export function getRolesForType(type: string): RolePreset[] {
    const typeRoles = TYPE_ROLES[type] || TYPE_ROLES['OTHER'];
    return [...COMMON_ROLES, ...typeRoles];
}

// ─── Event type presets ──────────────────────────────────────────

export const EVENT_TYPES_BY_ASSO: Record<string, { value: string; label: string }[]> = {
    FAMILY: [
        { value: 'MEETING', label: 'Réunion' },
        { value: 'AG', label: 'Assemblée Générale' },
        { value: 'FUNERAL', label: 'Deuil' },
        { value: 'WEDDING', label: 'Mariage / Dot' },
        { value: 'BIRTH', label: 'Naissance' },
        { value: 'ENTHRONEMENT', label: 'Intronisation' },
        { value: 'FESTIVAL', label: 'Fête du village' },
        { value: 'TONTINE', label: 'Tontine' },
        { value: 'OTHER', label: 'Autre' },
    ],
    CULTURAL: [
        { value: 'MEETING', label: 'Réunion' },
        { value: 'AG', label: 'Assemblée Générale' },
        { value: 'FESTIVAL', label: 'Festival' },
        { value: 'EXHIBITION', label: 'Exposition' },
        { value: 'SHOW', label: 'Spectacle' },
        { value: 'REHEARSAL', label: 'Répétition' },
        { value: 'WORKSHOP', label: 'Atelier' },
        { value: 'OTHER', label: 'Autre' },
    ],
    SPORTS: [
        { value: 'MEETING', label: 'Réunion' },
        { value: 'AG', label: 'Assemblée Générale' },
        { value: 'MATCH', label: 'Match' },
        { value: 'TRAINING', label: 'Entraînement' },
        { value: 'TOURNAMENT', label: 'Tournoi' },
        { value: 'OTHER', label: 'Autre' },
    ],
    POLITICAL: [
        { value: 'MEETING', label: 'Réunion' },
        { value: 'AG', label: 'Assemblée Générale' },
        { value: 'RALLY', label: 'Meeting politique' },
        { value: 'CAMPAIGN', label: 'Campagne' },
        { value: 'CONGRESS', label: 'Congrès' },
        { value: 'OTHER', label: 'Autre' },
    ],
    RELIGIOUS: [
        { value: 'MEETING', label: 'Réunion' },
        { value: 'AG', label: 'Assemblée Générale' },
        { value: 'SERVICE', label: 'Culte / Messe' },
        { value: 'RETREAT', label: 'Retraite spirituelle' },
        { value: 'PRAYER', label: 'Prière' },
        { value: 'CHARITY', label: 'Action caritative' },
        { value: 'OTHER', label: 'Autre' },
    ],
    OTHER: [
        { value: 'MEETING', label: 'Réunion' },
        { value: 'AG', label: 'Assemblée Générale' },
        { value: 'PARTY', label: 'Fête' },
        { value: 'WORKSHOP', label: 'Atelier' },
        { value: 'OTHER', label: 'Autre' },
    ],
};

// ─── Document category presets ───────────────────────────────────

export const DOC_CATEGORIES_BY_ASSO: Record<string, { value: string; label: string }[]> = {
    FAMILY: [
        { value: 'STATUTES', label: 'Statuts & Règlement' },
        { value: 'MEETING_MINUTES', label: 'Procès-verbaux' },
        { value: 'FINANCIAL', label: 'Documents financiers' },
        { value: 'GENEALOGY', label: 'Arbre généalogique' },
        { value: 'CEREMONY', label: 'Cérémonies (deuils, mariages)' },
        { value: 'ADMINISTRATIVE', label: 'Administratif' },
        { value: 'OTHER', label: 'Autre' },
    ],
    CULTURAL: [
        { value: 'STATUTES', label: 'Statuts & Règlement' },
        { value: 'MEETING_MINUTES', label: 'Procès-verbaux' },
        { value: 'FINANCIAL', label: 'Documents financiers' },
        { value: 'ARTISTIC', label: 'Supports artistiques' },
        { value: 'PRESS', label: 'Presse & Communication' },
        { value: 'ADMINISTRATIVE', label: 'Administratif' },
        { value: 'OTHER', label: 'Autre' },
    ],
    SPORTS: [
        { value: 'STATUTES', label: 'Statuts & Règlement' },
        { value: 'MEETING_MINUTES', label: 'Procès-verbaux' },
        { value: 'FINANCIAL', label: 'Documents financiers' },
        { value: 'LICENSES', label: 'Licences & Certificats médicaux' },
        { value: 'RESULTS', label: 'Résultats & Classements' },
        { value: 'ADMINISTRATIVE', label: 'Administratif' },
        { value: 'OTHER', label: 'Autre' },
    ],
    POLITICAL: [
        { value: 'STATUTES', label: 'Statuts & Règlement' },
        { value: 'MEETING_MINUTES', label: 'Procès-verbaux' },
        { value: 'FINANCIAL', label: 'Documents financiers' },
        { value: 'CAMPAIGN', label: 'Documents de campagne' },
        { value: 'PRESS', label: 'Communiqués de presse' },
        { value: 'ADMINISTRATIVE', label: 'Administratif' },
        { value: 'OTHER', label: 'Autre' },
    ],
    RELIGIOUS: [
        { value: 'STATUTES', label: 'Statuts & Règlement' },
        { value: 'MEETING_MINUTES', label: 'Procès-verbaux' },
        { value: 'FINANCIAL', label: 'Documents financiers' },
        { value: 'LITURGY', label: 'Documents liturgiques' },
        { value: 'CHARITY', label: 'Actions caritatives' },
        { value: 'ADMINISTRATIVE', label: 'Administratif' },
        { value: 'OTHER', label: 'Autre' },
    ],
    OTHER: [
        { value: 'STATUTES', label: 'Statuts & Règlement' },
        { value: 'MEETING_MINUTES', label: 'Procès-verbaux' },
        { value: 'FINANCIAL', label: 'Documents financiers' },
        { value: 'ADMINISTRATIVE', label: 'Administratif' },
        { value: 'OTHER', label: 'Autre' },
    ],
};

// ─── Member extra fields per association type ────────────────────

export const MEMBER_EXTRA_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'date' }[]> = {
    FAMILY: [
        { key: 'family_branch', label: 'Concession / Branche familiale', type: 'text' },
        { key: 'residence_city', label: 'Ville de résidence', type: 'text' },
        { key: 'residence_country', label: 'Pays de résidence', type: 'text' },
        { key: 'birth_date', label: 'Date de naissance', type: 'date' },
        { key: 'membership_date', label: "Date d'adhésion", type: 'date' },
    ],
    CULTURAL: [
        { key: 'residence_city', label: 'Ville de résidence', type: 'text' },
        { key: 'residence_country', label: 'Pays de résidence', type: 'text' },
        { key: 'birth_date', label: 'Date de naissance', type: 'date' },
        { key: 'membership_date', label: "Date d'adhésion", type: 'date' },
    ],
    SPORTS: [
        { key: 'residence_city', label: 'Ville de résidence', type: 'text' },
        { key: 'birth_date', label: 'Date de naissance', type: 'date' },
        { key: 'membership_date', label: "Date d'adhésion", type: 'date' },
    ],
    POLITICAL: [
        { key: 'residence_city', label: 'Ville de résidence', type: 'text' },
        { key: 'residence_country', label: 'Pays de résidence', type: 'text' },
        { key: 'membership_date', label: "Date d'adhésion", type: 'date' },
    ],
    RELIGIOUS: [
        { key: 'residence_city', label: 'Ville de résidence', type: 'text' },
        { key: 'residence_country', label: 'Pays de résidence', type: 'text' },
        { key: 'birth_date', label: 'Date de naissance', type: 'date' },
        { key: 'membership_date', label: "Date d'adhésion", type: 'date' },
    ],
    OTHER: [
        { key: 'residence_city', label: 'Ville de résidence', type: 'text' },
        { key: 'residence_country', label: 'Pays de résidence', type: 'text' },
        { key: 'membership_date', label: "Date d'adhésion", type: 'date' },
    ],
};
