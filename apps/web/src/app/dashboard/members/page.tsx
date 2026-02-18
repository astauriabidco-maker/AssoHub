"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import {
    Plus,
    Users,
    Mail,
    User,
    Shield,
    MoreHorizontal,
    UserCheck,
    UserX,
    Eye,
    Pencil,
    Trash2,
    AlertTriangle,
    Search,
    LayoutList,
    LayoutGrid,
    MapPin,
    Filter,
    Phone,
    CreditCard,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import MemberSlideOver from "@/components/members/MemberSlideOver";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

interface Member {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
    status: string;
    gender: string | null;
    isVirtual: boolean;
    residence_city: string | null;
    residence_country: string | null;
    family_branch: string | null;
    birth_date: string | null;
    membership_date: string | null;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
    slug: string;
    color: string;
    permissions: string[];
    isSystem: boolean;
}

// ── Fallback styles for roles not yet fetched ──
const FALLBACK_ROLE_COLORS: Record<string, string> = {
    ADMIN: "#8b5cf6",
    PRESIDENT: "#10b981",
    TREASURER: "#f59e0b",
    SECRETARY: "#06b6d4",
    MEMBER: "#3b82f6",
    CHIEF: "#d97706",
    NOTABLE: "#10b981",
    ELDER: "#f59e0b",
};

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    SUSPENDED: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Actif",
    PENDING: "En attente",
    SUSPENDED: "Suspendu",
};

const COUNTRY_FLAGS: Record<string, string> = {
    CM: "🇨🇲", FR: "🇫🇷", BE: "🇧🇪", CA: "🇨🇦", DE: "🇩🇪", US: "🇺🇸",
    GB: "🇬🇧", CH: "🇨🇭", IT: "🇮🇹", ES: "🇪🇸", CI: "🇨🇮", GA: "🇬🇦",
    SN: "🇸🇳", CG: "🇨🇬", CD: "🇨🇩", NG: "🇳🇬", GQ: "🇬🇶", TD: "🇹🇩",
};

type FinanceSummaryMap = Record<string, { total: number; paid: number; pending: number; overdue: number }>;

const FINANCE_STATUS_LABELS: Record<string, string> = {
    ALL: "Tous",
    ALL_PAID: "✅ Tout payé",
    HAS_PENDING: "🟡 En attente",
    HAS_OVERDUE: "🔴 En retard",
    NO_FEES: "⚪ Aucune cotisation",
};

function getFinanceBadge(summary: FinanceSummaryMap, memberId: string) {
    const s = summary[memberId];
    if (!s || s.total === 0) return { label: "—", style: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
    if (s.overdue > 0) return { label: `${s.overdue} retard`, style: "bg-red-500/15 text-red-400 border-red-500/25" };
    if (s.pending > 0) return { label: `${s.pending} en attente`, style: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" };
    return { label: "✓ À jour", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [financeSummary, setFinanceSummary] = useState<FinanceSummaryMap>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Filters
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [filterFinance, setFilterFinance] = useState<string>("ALL");
    const [showFilters, setShowFilters] = useState(false);

    // View mode
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Add modal
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "MEMBER",
        gender: "",
        residence_city: "",
        residence_country: "",
        family_branch: "",
        parentIds: [] as string[],
        spouseId: "",
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "MEMBER",
        residence_city: "",
        residence_country: "",
        family_branch: "",
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteMember, setDeleteMember] = useState<Member | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Slide-over
    const [viewMember, setViewMember] = useState<Member | null>(null);

    // Action dropdown
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // ── Helpers for dynamic role display ──
    function getRoleColor(slug: string): string {
        const role = roles.find((r) => r.slug === slug);
        return role?.color || FALLBACK_ROLE_COLORS[slug] || "#6b7280";
    }

    function getRoleLabel(slug: string): string {
        const role = roles.find((r) => r.slug === slug);
        return role?.name || slug;
    }

    function roleBadgeStyle(slug: string): React.CSSProperties {
        const c = getRoleColor(slug);
        return {
            backgroundColor: `${c}20`,
            color: c,
            borderColor: `${c}50`,
        };
    }

    // ── Stats ──
    const stats = useMemo(() => {
        const active = members.filter((m) => m.status === "ACTIVE").length;
        const pending = members.filter((m) => m.status === "PENDING").length;
        const suspended = members.filter((m) => m.status === "SUSPENDED").length;
        return { total: members.length, active, pending, suspended };
    }, [members]);

    // ── Unique role slugs for filter ──
    const uniqueRoles = useMemo(() => {
        const slugs = [...new Set(members.map((m) => m.role))];
        return slugs;
    }, [members]);

    // ── Filtered members ──
    const filteredMembers = useMemo(() => {
        let result = members;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (m) =>
                    (m.firstName || "").toLowerCase().includes(q) ||
                    (m.lastName || "").toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q) ||
                    getRoleLabel(m.role).toLowerCase().includes(q) ||
                    (m.residence_city || "").toLowerCase().includes(q) ||
                    (m.residence_country || "").toLowerCase().includes(q)
            );
        }
        if (filterRole !== "ALL") {
            result = result.filter((m) => m.role === filterRole);
        }
        if (filterStatus !== "ALL") {
            result = result.filter((m) => m.status === filterStatus);
        }
        if (filterFinance !== "ALL") {
            result = result.filter((m) => {
                const s = financeSummary[m.id];
                if (filterFinance === "NO_FEES") return !s || s.total === 0;
                if (filterFinance === "ALL_PAID") return s && s.total > 0 && s.overdue === 0 && s.pending === 0;
                if (filterFinance === "HAS_PENDING") return s && s.pending > 0;
                if (filterFinance === "HAS_OVERDUE") return s && s.overdue > 0;
                return true;
            });
        }
        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members, search, roles, filterRole, filterStatus, filterFinance, financeSummary]);

    async function loadData() {
        try {
            const [membersRes, rolesData, finData] = await Promise.all([
                apiGet("/users?limit=500"),
                apiGet("/roles"),
                apiGet("/finance/members-summary").catch(() => ({})),
            ]);
            const membersPayload = membersRes as { data?: Member[] } | Member[];
            setMembers(Array.isArray(membersPayload) ? membersPayload : (membersPayload.data || []));
            setRoles(rolesData as Role[]);
            setFinanceSummary(finData as FinanceSummaryMap);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick() {
            setActionMenuId(null);
        }
        if (actionMenuId) {
            document.addEventListener("click", handleClick);
            return () => document.removeEventListener("click", handleClick);
        }
    }, [actionMenuId]);

    // ── Add ──
    async function handleAdd(e: FormEvent) {
        e.preventDefault();
        setAddError("");
        setAddLoading(true);
        try {
            const payload = {
                ...addForm,
                gender: addForm.gender || undefined,
                residence_city: addForm.residence_city || undefined,
                residence_country: addForm.residence_country || undefined,
                family_branch: addForm.family_branch || undefined,
                parentIds: addForm.parentIds.length > 0 ? addForm.parentIds : undefined,
                spouseId: addForm.spouseId || undefined,
            };
            await apiPost("/users", payload);
            setAddOpen(false);
            setAddForm({
                firstName: "", lastName: "", email: "", phone: "",
                role: "MEMBER", gender: "", residence_city: "", residence_country: "",
                family_branch: "", parentIds: [], spouseId: "",
            });
            await loadData();
        } catch (err) {
            setAddError(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
        } finally {
            setAddLoading(false);
        }
    }

    // ── Edit ──
    function openEdit(m: Member) {
        setEditMember(m);
        setEditForm({
            firstName: m.firstName || "",
            lastName: m.lastName || "",
            email: m.email,
            phone: m.phone || "",
            role: m.role,
            residence_city: m.residence_city || "",
            residence_country: m.residence_country || "",
            family_branch: m.family_branch || "",
        });
        setEditError("");
        setEditOpen(true);
        setActionMenuId(null);
    }

    async function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!editMember) return;
        setEditError("");
        setEditLoading(true);
        try {
            await apiPatch(`/users/${editMember.id}`, editForm);
            setEditOpen(false);
            setEditMember(null);
            await loadData();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : "Erreur lors de la modification.");
        } finally {
            setEditLoading(false);
        }
    }

    // ── Delete ──
    function openDelete(m: Member) {
        setDeleteMember(m);
        setDeleteOpen(true);
        setActionMenuId(null);
    }

    async function handleDelete() {
        if (!deleteMember) return;
        setDeleteLoading(true);
        try {
            await apiDelete(`/users/${deleteMember.id}`);
            setDeleteOpen(false);
            setDeleteMember(null);
            await loadData();
        } catch {
            // silent
        } finally {
            setDeleteLoading(false);
        }
    }

    // ── Status toggle ──
    async function toggleStatus(m: Member) {
        const newStatus = m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        try {
            await apiPatch(`/users/${m.id}/status`, { status: newStatus });
            await loadData();
        } catch {
            // silent
        }
        setActionMenuId(null);
    }

    // ── Role Select Component ──
    function RoleSelect({
        value,
        onChange,
    }: {
        value: string;
        onChange: (val: string) => void;
    }) {
        return (
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300 ml-1">
                    Rôle
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Shield className="w-4 h-4" />
                    </div>
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all duration-200 hover:bg-white/[0.07] appearance-none cursor-pointer"
                    >
                        {roles.length > 0
                            ? roles.map((r) => (
                                <option
                                    key={r.slug}
                                    value={r.slug}
                                    className="bg-slate-800"
                                >
                                    {r.name}
                                </option>
                            ))
                            : (
                                <>
                                    <option value="MEMBER" className="bg-slate-800">Membre</option>
                                    <option value="ADMIN" className="bg-slate-800">Administrateur</option>
                                </>
                            )}
                    </select>
                </div>
            </div>
        );
    }

    // ── Location helper ──
    function memberLocation(m: Member): string | null {
        const parts: string[] = [];
        if (m.residence_city) parts.push(m.residence_city);
        if (m.residence_country) {
            const flag = COUNTRY_FLAGS[m.residence_country.toUpperCase()] || "";
            parts.push(`${flag} ${m.residence_country}`);
        }
        return parts.length > 0 ? parts.join(", ") : null;
    }

    // ── Active filters count ──
    const activeFilterCount =
        (filterRole !== "ALL" ? 1 : 0) + (filterStatus !== "ALL" ? 1 : 0) + (filterFinance !== "ALL" ? 1 : 0);

    return (
        <RequirePermission permissions={["members.view"]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Membres
                        {!loading && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                ({filteredMembers.length}{search || activeFilterCount > 0 ? ` / ${members.length}` : ""})
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* View mode toggle */}
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === "table"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                                title="Vue tableau"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === "grid"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                                title="Trombinoscope"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <GlassButton
                            className="!w-auto px-5"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => setAddOpen(true)}
                        >
                            Ajouter un membre
                        </GlassButton>
                    </div>
                </div>

                {/* Stats pills */}
                {!loading && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-medium">{stats.total}</span> Total
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="font-medium">{stats.active}</span> Actifs
                        </div>
                        {stats.pending > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300">
                                <span className="font-medium">{stats.pending}</span> En attente
                            </div>
                        )}
                        {stats.suspended > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                                <span className="font-medium">{stats.suspended}</span> Suspendus
                            </div>
                        )}
                    </div>
                )}

                {/* Search & Filters bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[250px] max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email, rôle, ville…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all duration-200 hover:bg-white/[0.07]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter toggle button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${showFilters || activeFilterCount > 0
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filtres
                        {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter pills */}
                {showFilters && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-white/5 border border-white/10 rounded-xl p-4 animate-in slide-in-from-top-2">
                        {/* Role filter */}
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rôle</label>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setFilterRole("ALL")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterRole === "ALL"
                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                        }`}
                                >
                                    Tous
                                </button>
                                {uniqueRoles.map((slug) => (
                                    <button
                                        key={slug}
                                        onClick={() => setFilterRole(slug === filterRole ? "ALL" : slug)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
                                        style={
                                            filterRole === slug
                                                ? roleBadgeStyle(slug)
                                                : {
                                                    backgroundColor: "rgba(255,255,255,0.03)",
                                                    color: "#9ca3af",
                                                    borderColor: "rgba(255,255,255,0.1)",
                                                }
                                        }
                                    >
                                        {getRoleLabel(slug)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</label>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setFilterStatus("ALL")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterStatus === "ALL"
                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                        }`}
                                >
                                    Tous
                                </button>
                                {Object.keys(STATUS_LABELS).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s === filterStatus ? "ALL" : s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${filterStatus === s
                                            ? STATUS_STYLES[s]
                                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Finance filter */}
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Finances</label>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.keys(FINANCE_STATUS_LABELS).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilterFinance(key === filterFinance ? "ALL" : key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${filterFinance === key
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        {FINANCE_STATUS_LABELS[key]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reset */}
                        {activeFilterCount > 0 && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setFilterRole("ALL");
                                        setFilterStatus("ALL");
                                        setFilterFinance("ALL");
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TROMBINOSCOPE VIEW ── */}
                {viewMode === "grid" ? (
                    <div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">Aucun membre trouvé.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredMembers.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setViewMember(m)}
                                        className="group relative bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 cursor-pointer"
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-lg font-bold uppercase shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${getRoleColor(m.role)}, ${getRoleColor(m.role)}88)`,
                                            }}
                                        >
                                            {(m.firstName?.[0] || "") + (m.lastName?.[0] || m.email[0])}
                                        </div>

                                        {/* Name */}
                                        <h3 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                            {m.firstName || ""} {m.lastName || ""}
                                            {!m.firstName && !m.lastName && (
                                                <span className="text-gray-500 italic text-xs">Non renseigné</span>
                                            )}
                                        </h3>

                                        {/* Role */}
                                        <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border mt-1.5"
                                            style={roleBadgeStyle(m.role)}
                                        >
                                            {getRoleLabel(m.role)}
                                        </span>

                                        {/* Location */}
                                        {memberLocation(m) && (
                                            <p className="text-[10px] text-gray-500 mt-1.5 truncate flex items-center justify-center gap-1">
                                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                                {memberLocation(m)}
                                            </p>
                                        )}

                                        {/* Finance badge */}
                                        {(() => {
                                            const fb = getFinanceBadge(financeSummary, m.id);
                                            return (
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border mt-1.5 ${fb.style}`}>
                                                    <CreditCard className="w-2.5 h-2.5" />
                                                    {fb.label}
                                                </span>
                                            );
                                        })()}

                                        {/* Status dot */}
                                        <div
                                            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${m.status === "ACTIVE"
                                                ? "bg-emerald-400"
                                                : m.status === "PENDING"
                                                    ? "bg-yellow-400"
                                                    : "bg-red-400"
                                                }`}
                                            title={STATUS_LABELS[m.status] || m.status}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── TABLE VIEW ── */
                    <GlassCard className="!p-0 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                {search || activeFilterCount > 0 ? (
                                    <>
                                        <p className="text-sm">Aucun résultat pour vos critères</p>
                                        <p className="text-xs mt-1">
                                            Essayez de modifier votre recherche ou vos filtres.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm">Aucun membre pour le moment.</p>
                                        <p className="text-xs mt-1">
                                            Cliquez sur &quot;Ajouter un membre&quot; pour commencer.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                                Nom complet
                                            </th>
                                            <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                                Email
                                            </th>
                                            <th className="text-left text-gray-400 font-medium px-5 py-3.5 hidden lg:table-cell">
                                                Résidence
                                            </th>
                                            <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                                Rôle
                                            </th>
                                            <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                                Statut
                                            </th>
                                            <th className="text-left text-gray-400 font-medium px-5 py-3.5 hidden md:table-cell">
                                                Finances
                                            </th>
                                            <th className="text-right text-gray-400 font-medium px-5 py-3.5">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMembers.map((m) => (
                                            <tr
                                                key={m.id}
                                                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                                            >
                                                {/* Name */}
                                                <td className="px-5 py-3.5">
                                                    <button
                                                        onClick={() => {
                                                            setViewMember(m);
                                                            setActionMenuId(null);
                                                        }}
                                                        className="flex items-center gap-3 hover:text-blue-400 transition-colors cursor-pointer text-left group"
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shrink-0"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${getRoleColor(m.role)}, ${getRoleColor(m.role)}99)`,
                                                            }}
                                                        >
                                                            {(m.firstName?.[0] || "") +
                                                                (m.lastName?.[0] || m.email[0])}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                                                                {m.firstName || ""} {m.lastName || ""}
                                                                {!m.firstName && !m.lastName && (
                                                                    <span className="text-gray-500 italic">
                                                                        Non renseigné
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </button>
                                                </td>
                                                {/* Email */}
                                                <td className="px-5 py-3.5 text-gray-300">
                                                    {m.email}
                                                </td>
                                                {/* Residence */}
                                                <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                                                    {memberLocation(m) ? (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 shrink-0" />
                                                            {memberLocation(m)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600">—</span>
                                                    )}
                                                </td>
                                                {/* Role badge */}
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border"
                                                        style={roleBadgeStyle(m.role)}
                                                    >
                                                        {getRoleLabel(m.role)}
                                                    </span>
                                                </td>
                                                {/* Status */}
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${STATUS_STYLES[m.status] ||
                                                            STATUS_STYLES.PENDING
                                                            }`}
                                                    >
                                                        {STATUS_LABELS[m.status] || m.status}
                                                    </span>
                                                </td>
                                                {/* Finance badge */}
                                                <td className="px-5 py-3.5 hidden md:table-cell">
                                                    {(() => {
                                                        const fb = getFinanceBadge(financeSummary, m.id);
                                                        return (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${fb.style}`}>
                                                                <CreditCard className="w-3 h-3" />
                                                                {fb.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                {/* Actions */}
                                                <td className="px-5 py-3.5 text-right relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionMenuId(
                                                                actionMenuId === m.id
                                                                    ? null
                                                                    : m.id
                                                            );
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>

                                                    {actionMenuId === m.id && (
                                                        <div
                                                            className="absolute right-5 top-12 z-20 w-48 backdrop-blur-md bg-slate-800/95 border border-white/10 rounded-lg shadow-xl py-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setViewMember(m);
                                                                    setActionMenuId(null);
                                                                }}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                                                            >
                                                                <Eye className="w-4 h-4 text-blue-400" />
                                                                Voir la fiche
                                                            </button>
                                                            <button
                                                                onClick={() => openEdit(m)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                                                            >
                                                                <Pencil className="w-4 h-4 text-amber-400" />
                                                                Modifier
                                                            </button>
                                                            <button
                                                                onClick={() => toggleStatus(m)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                                                            >
                                                                {m.status === "ACTIVE" ? (
                                                                    <>
                                                                        <UserX className="w-4 h-4 text-orange-400" />
                                                                        <span>Suspendre</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="w-4 h-4 text-emerald-400" />
                                                                        <span>Activer</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                            <div className="border-t border-white/10 my-1" />
                                                            <button
                                                                onClick={() => openDelete(m)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                )}

                {/* ── Add Modal ── */}
                <GlassModal
                    open={addOpen}
                    onClose={() => setAddOpen(false)}
                    title="Ajouter un membre"
                >
                    <form onSubmit={handleAdd} className="space-y-4">
                        {addError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                                {addError}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput
                                label="Prénom"
                                placeholder="Jean"
                                icon={<User className="w-4 h-4" />}
                                value={addForm.firstName}
                                onChange={(e) =>
                                    setAddForm((p) => ({
                                        ...p,
                                        firstName: e.target.value,
                                    }))
                                }
                            />
                            <GlassInput
                                label="Nom"
                                placeholder="Dupont"
                                icon={<User className="w-4 h-4" />}
                                value={addForm.lastName}
                                onChange={(e) =>
                                    setAddForm((p) => ({
                                        ...p,
                                        lastName: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <GlassInput
                            label="Email"
                            type="email"
                            placeholder="membre@asso.com"
                            icon={<Mail className="w-4 h-4" />}
                            value={addForm.email}
                            onChange={(e) =>
                                setAddForm((p) => ({
                                    ...p,
                                    email: e.target.value,
                                }))
                            }
                            required
                        />
                        <GlassInput
                            label="Téléphone"
                            placeholder="+237 6XX XXX XXX"
                            icon={<Phone className="w-4 h-4" />}
                            value={addForm.phone}
                            onChange={(e) =>
                                setAddForm((p) => ({
                                    ...p,
                                    phone: e.target.value,
                                }))
                            }
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput
                                label="Ville de résidence"
                                placeholder="Douala, Paris…"
                                icon={<MapPin className="w-4 h-4" />}
                                value={addForm.residence_city}
                                onChange={(e) =>
                                    setAddForm((p) => ({
                                        ...p,
                                        residence_city: e.target.value,
                                    }))
                                }
                            />
                            <GlassInput
                                label="Pays (code)"
                                placeholder="CM, FR, BE…"
                                icon={<MapPin className="w-4 h-4" />}
                                value={addForm.residence_country}
                                onChange={(e) =>
                                    setAddForm((p) => ({
                                        ...p,
                                        residence_country: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <GlassInput
                            label="Branche familiale"
                            placeholder="Concession / Famille de…"
                            icon={<Users className="w-4 h-4" />}
                            value={addForm.family_branch}
                            onChange={(e) =>
                                setAddForm((p) => ({
                                    ...p,
                                    family_branch: e.target.value,
                                }))
                            }
                        />

                        {/* Genre */}
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Genre</label>
                            <select
                                value={addForm.gender}
                                onChange={(e) => setAddForm((p) => ({ ...p, gender: e.target.value }))}
                                className="w-full px-3 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="">Non spécifié</option>
                                <option value="MALE">Homme</option>
                                <option value="FEMALE">Femme</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>

                        {/* Parent(s) — only for FAMILY type */}
                        {members.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Parent(s) dans l&apos;arbre</label>
                                <select
                                    multiple
                                    value={addForm.parentIds}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, o => o.value);
                                        setAddForm((p) => ({ ...p, parentIds: selected }));
                                    }}
                                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[60px]"
                                >
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1">Ctrl+clic pour sélectionner plusieurs</p>
                            </div>
                        )}

                        {/* Conjoint(e) */}
                        {members.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Conjoint(e)</label>
                                <select
                                    value={addForm.spouseId}
                                    onChange={(e) => setAddForm((p) => ({ ...p, spouseId: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                >
                                    <option value="">Aucun</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <RoleSelect
                            value={addForm.role}
                            onChange={(val) =>
                                setAddForm((p) => ({ ...p, role: val }))
                            }
                        />
                        <div className="pt-2">
                            <GlassButton
                                type="submit"
                                isLoading={addLoading}
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Ajouter
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>

                {/* ── Edit Modal ── */}
                <GlassModal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    title="Modifier le membre"
                >
                    <form onSubmit={handleEdit} className="space-y-4">
                        {editError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                                {editError}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput
                                label="Prénom"
                                placeholder="Jean"
                                icon={<User className="w-4 h-4" />}
                                value={editForm.firstName}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        firstName: e.target.value,
                                    }))
                                }
                            />
                            <GlassInput
                                label="Nom"
                                placeholder="Dupont"
                                icon={<User className="w-4 h-4" />}
                                value={editForm.lastName}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        lastName: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <GlassInput
                            label="Email"
                            type="email"
                            placeholder="membre@asso.com"
                            icon={<Mail className="w-4 h-4" />}
                            value={editForm.email}
                            onChange={(e) =>
                                setEditForm((p) => ({
                                    ...p,
                                    email: e.target.value,
                                }))
                            }
                            required
                        />
                        <GlassInput
                            label="Téléphone"
                            placeholder="+237 6XX XXX XXX"
                            icon={<Phone className="w-4 h-4" />}
                            value={editForm.phone}
                            onChange={(e) =>
                                setEditForm((p) => ({
                                    ...p,
                                    phone: e.target.value,
                                }))
                            }
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput
                                label="Ville de résidence"
                                placeholder="Douala, Paris…"
                                icon={<MapPin className="w-4 h-4" />}
                                value={editForm.residence_city}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        residence_city: e.target.value,
                                    }))
                                }
                            />
                            <GlassInput
                                label="Pays (code)"
                                placeholder="CM, FR, BE…"
                                icon={<MapPin className="w-4 h-4" />}
                                value={editForm.residence_country}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        residence_country: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <GlassInput
                            label="Branche familiale"
                            placeholder="Concession / Famille de…"
                            icon={<Users className="w-4 h-4" />}
                            value={editForm.family_branch}
                            onChange={(e) =>
                                setEditForm((p) => ({
                                    ...p,
                                    family_branch: e.target.value,
                                }))
                            }
                        />
                        <RoleSelect
                            value={editForm.role}
                            onChange={(val) =>
                                setEditForm((p) => ({ ...p, role: val }))
                            }
                        />
                        <div className="pt-2">
                            <GlassButton
                                type="submit"
                                isLoading={editLoading}
                                icon={<Pencil className="w-4 h-4" />}
                            >
                                Enregistrer
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>

                {/* ── Delete Confirmation Modal ── */}
                <GlassModal
                    open={deleteOpen}
                    onClose={() => setDeleteOpen(false)}
                    title="Confirmer la suppression"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-red-300 font-medium">
                                    Êtes-vous sûr de vouloir supprimer ce membre ?
                                </p>
                                <p className="text-xs text-red-400/70 mt-1">
                                    <strong>
                                        {deleteMember?.firstName}{" "}
                                        {deleteMember?.lastName}
                                    </strong>{" "}
                                    ({deleteMember?.email}) sera définitivement
                                    retiré de l&apos;association. Cette action
                                    est irréversible.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteOpen(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />{" "}
                                        Supprimer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </GlassModal>

                {/* ── Member Slide-Over ── */}
                <MemberSlideOver
                    member={viewMember}
                    roles={roles}
                    onClose={() => setViewMember(null)}
                />
            </div>
        </RequirePermission>
    );
}
