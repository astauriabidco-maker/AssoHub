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
    role: string;
    status: string;
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

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Add modal
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "MEMBER",
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
        role: "MEMBER",
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

    // ── Filtered members ──
    const filteredMembers = useMemo(() => {
        if (!search.trim()) return members;
        const q = search.toLowerCase();
        return members.filter(
            (m) =>
                (m.firstName || "").toLowerCase().includes(q) ||
                (m.lastName || "").toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                getRoleLabel(m.role).toLowerCase().includes(q)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members, search, roles]);

    async function loadData() {
        try {
            const [membersData, rolesData] = await Promise.all([
                apiGet("/users"),
                apiGet("/roles"),
            ]);
            setMembers(membersData as Member[]);
            setRoles(rolesData as Role[]);
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
            await apiPost("/users", addForm);
            setAddOpen(false);
            setAddForm({ firstName: "", lastName: "", email: "", role: "MEMBER" });
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
            role: m.role,
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
                                    <option value="TREASURER" className="bg-slate-800">Trésorier</option>
                                    <option value="SECRETARY" className="bg-slate-800">Secrétaire</option>
                                    <option value="ADMIN" className="bg-slate-800">Administrateur</option>
                                </>
                            )}
                    </select>
                </div>
            </div>
        );
    }

    return (
        <RequirePermission permissions={["members.view"]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Membres
                        {!loading && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                ({filteredMembers.length}{search ? ` / ${members.length}` : ""})
                            </span>
                        )}
                    </h2>
                    <GlassButton
                        className="!w-auto px-5"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setAddOpen(true)}
                    >
                        Ajouter un membre
                    </GlassButton>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email ou rôle…"
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

                {/* Table */}
                <GlassCard className="!p-0 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            {search ? (
                                <>
                                    <p className="text-sm">Aucun résultat pour &quot;{search}&quot;</p>
                                    <p className="text-xs mt-1">
                                        Essayez un autre terme de recherche.
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
                                        <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                            Rôle
                                        </th>
                                        <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                            Statut
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
                                            {/* Role badge — dynamic colors */}
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
