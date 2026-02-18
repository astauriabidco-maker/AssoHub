"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    FolderOpen,
    Plus,
    Users,
    Pencil,
    Trash2,
    UserPlus,
    UserMinus,
    Search,
    Crown,
    ChevronRight,
    X,
    AlertTriangle,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

/* ─────── Types ─────── */
interface Member {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role?: string;
    status?: string;
    residence_city?: string | null;
    residence_country?: string | null;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    leaderId: string | null;
    leader: Member | null;
    members?: Member[];
    _count?: { members: number };
    createdAt: string;
}

/* ─────── Constants ─────── */
const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
];

function groupColor(index: number) {
    return COLORS[index % COLORS.length];
}

function memberName(m: Member) {
    const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
    return name || m.email;
}

function initials(m: Member) {
    return (m.firstName?.[0] || "") + (m.lastName?.[0] || m.email[0]);
}

/* ─────── Page ─────── */
export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Create / Edit
    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        leaderId: "",
        memberIds: [] as string[],
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    // Detail
    const [detailGroup, setDetailGroup] = useState<Group | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Delete confirm
    const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Add members
    const [addMembersOpen, setAddMembersOpen] = useState(false);
    const [addMemberSearch, setAddMemberSearch] = useState("");
    const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
    const [addMembersLoading, setAddMembersLoading] = useState(false);

    // ── Load data ──
    async function loadData() {
        try {
            const [g, m] = await Promise.all([
                apiGet("/groups"),
                apiGet("/users?limit=500"),
            ]);
            setGroups(g as Group[]);
            const membersPayload = m as { data?: Member[] } | Member[];
            setAllMembers(Array.isArray(membersPayload) ? membersPayload : (membersPayload.data || []));
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // ── Filtered groups ──
    const filteredGroups = groups.filter((g) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            g.name.toLowerCase().includes(q) ||
            (g.description || "").toLowerCase().includes(q) ||
            memberName(g.leader || { id: "", email: "", firstName: null, lastName: null }).toLowerCase().includes(q)
        );
    });

    // ── Open create/edit ──
    function openCreate() {
        setEditId(null);
        setForm({ name: "", description: "", leaderId: "", memberIds: [] });
        setFormError("");
        setFormOpen(true);
    }

    function openEdit(g: Group) {
        setEditId(g.id);
        setForm({
            name: g.name,
            description: g.description || "",
            leaderId: g.leaderId || "",
            memberIds: g.members?.map((m) => m.id) || [],
        });
        setFormError("");
        setFormOpen(true);
        setDetailGroup(null);
    }

    // ── Submit create/edit ──
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormError("Le nom du groupe est requis.");
            return;
        }
        setFormLoading(true);
        setFormError("");
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                leaderId: form.leaderId || undefined,
                memberIds: form.memberIds,
            };
            if (editId) {
                await apiPatch(`/groups/${editId}`, payload);
            } else {
                await apiPost("/groups", payload);
            }
            setFormOpen(false);
            await loadData();
        } catch {
            setFormError("Erreur lors de l'enregistrement.");
        } finally {
            setFormLoading(false);
        }
    }

    // ── View detail ──
    async function viewDetail(group: Group) {
        setDetailLoading(true);
        setDetailGroup(group);
        try {
            const data = await apiGet(`/groups/${group.id}`);
            setDetailGroup(data as Group);
        } catch {
            // keep existing data
        } finally {
            setDetailLoading(false);
        }
    }

    // ── Delete ──
    async function handleDelete() {
        if (!deleteGroup) return;
        setDeleteLoading(true);
        try {
            await apiDelete(`/groups/${deleteGroup.id}`);
            setDeleteGroup(null);
            setDetailGroup(null);
            await loadData();
        } catch {
            // silent
        } finally {
            setDeleteLoading(false);
        }
    }

    // ── Remove member from group ──
    async function handleRemoveMember(memberId: string) {
        if (!detailGroup) return;
        try {
            await apiDelete(`/groups/${detailGroup.id}/members/${memberId}`);
            const data = await apiGet(`/groups/${detailGroup.id}`);
            setDetailGroup(data as Group);
            await loadData();
        } catch {
            // silent
        }
    }

    // ── Add members ──
    function openAddMembers() {
        setAddMemberSearch("");
        setSelectedNewMembers([]);
        setAddMembersOpen(true);
    }

    async function handleAddMembers() {
        if (!detailGroup || selectedNewMembers.length === 0) return;
        setAddMembersLoading(true);
        try {
            await apiPost(`/groups/${detailGroup.id}/members`, { memberIds: selectedNewMembers });
            const data = await apiGet(`/groups/${detailGroup.id}`);
            setDetailGroup(data as Group);
            setAddMembersOpen(false);
            await loadData();
        } catch {
            // silent
        } finally {
            setAddMembersLoading(false);
        }
    }

    // ── Members not already in detail group ──
    const availableMembers = allMembers.filter(
        (m) => !detailGroup?.members?.some((gm) => gm.id === m.id)
    );
    const filteredAvailable = availableMembers.filter((m) => {
        if (!addMemberSearch.trim()) return true;
        const q = addMemberSearch.toLowerCase();
        return memberName(m).toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });

    return (
        <RequirePermission permissions={["groups.view"]}>
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-indigo-400" />
                        Groupes
                        {!loading && (
                            <span className="text-sm font-normal text-gray-400 ml-1">
                                ({groups.length})
                            </span>
                        )}
                    </h2>
                    <GlassButton
                        className="!w-auto px-5"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={openCreate}
                    >
                        Créer un groupe
                    </GlassButton>
                </div>

                {/* ── Search ── */}
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher un groupe…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all hover:bg-white/[0.07]"
                    />
                </div>

                {/* ── Groups grid ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">
                            {groups.length === 0
                                ? "Aucun groupe pour le moment."
                                : "Aucun groupe ne correspond à votre recherche."}
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredGroups.map((g, i) => {
                            const color = groupColor(i);
                            const count = g._count?.members ?? g.members?.length ?? 0;
                            return (
                                <button
                                    key={g.id}
                                    onClick={() => viewDetail(g)}
                                    className="group relative bg-white/5 border border-white/10 rounded-xl p-5 text-left hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 cursor-pointer"
                                >
                                    {/* Color strip */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                        style={{ backgroundColor: color }}
                                    />

                                    <div className="flex items-start justify-between mb-3 mt-1">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                                style={{ background: `${color}30`, color }}
                                            >
                                                {g.name[0]?.toUpperCase() || "G"}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                                    {g.name}
                                                </h3>
                                                {g.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-[200px]">
                                                        {g.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {count} membre{count !== 1 ? "s" : ""}
                                        </span>
                                        {g.leader && (
                                            <span className="flex items-center gap-1.5">
                                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                                {memberName(g.leader)}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Detail slide-over ── */}
                {detailGroup && (
                    <>
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setDetailGroup(null)} />
                        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 shadow-2xl overflow-auto animate-in slide-in-from-right-8 duration-300">
                            <div className="p-6 space-y-6">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{detailGroup.name}</h3>
                                        {detailGroup.description && (
                                            <p className="text-sm text-gray-400 mt-1">{detailGroup.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(detailGroup)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                                            title="Modifier"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteGroup(detailGroup)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDetailGroup(null)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Leader */}
                                {detailGroup.leader && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm uppercase">
                                            {initials(detailGroup.leader)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-300/70 font-medium uppercase tracking-wider">Responsable</p>
                                            <p className="text-sm text-white font-medium">{memberName(detailGroup.leader)}</p>
                                            <p className="text-xs text-gray-500">{detailGroup.leader.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Members */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                            <Users className="w-4 h-4 text-indigo-400" />
                                            Membres ({detailGroup.members?.length || 0})
                                        </h4>
                                        <button
                                            onClick={openAddMembers}
                                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Ajouter
                                        </button>
                                    </div>

                                    {detailLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : !detailGroup.members?.length ? (
                                        <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                                            <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                                            <p className="text-xs text-gray-500">Aucun membre dans ce groupe.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[50vh] overflow-auto">
                                            {detailGroup.members.map((m) => (
                                                <div
                                                    key={m.id}
                                                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 hover:bg-white/[0.07] transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold uppercase">
                                                            {initials(m)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{memberName(m)}</p>
                                                            <p className="text-xs text-gray-500">{m.email}</p>
                                                        </div>
                                                        {m.id === detailGroup.leaderId && (
                                                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveMember(m.id)}
                                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer"
                                                        title="Retirer du groupe"
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Create / Edit modal ── */}
                <GlassModal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Modifier le groupe" : "Nouveau groupe"}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {formError}
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Nom du groupe *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                                placeholder="Ex: Commission Finances"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all resize-none"
                                placeholder="Description du groupe (optionnel)"
                            />
                        </div>

                        {/* Leader */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Responsable</label>
                            <select
                                value={form.leaderId}
                                onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                            >
                                <option value="">— Aucun —</option>
                                {allMembers.map((m) => (
                                    <option key={m.id} value={m.id} className="bg-slate-800">
                                        {memberName(m)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Members multi-select */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                                Membres ({form.memberIds.length} sélectionné{form.memberIds.length !== 1 ? "s" : ""})
                            </label>
                            <div className="max-h-40 overflow-auto bg-white/5 border border-white/10 rounded-lg p-2 space-y-1">
                                {allMembers.map((m) => (
                                    <label
                                        key={m.id}
                                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.memberIds.includes(m.id)}
                                            onChange={(e) => {
                                                setForm({
                                                    ...form,
                                                    memberIds: e.target.checked
                                                        ? [...form.memberIds, m.id]
                                                        : form.memberIds.filter((id) => id !== m.id),
                                                });
                                            }}
                                            className="rounded accent-indigo-500"
                                        />
                                        <span className="text-sm text-gray-300">{memberName(m)}</span>
                                        <span className="text-xs text-gray-600">{m.email}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <GlassButton type="submit" className="!w-auto px-6" disabled={formLoading}>
                                {formLoading ? "Enregistrement…" : editId ? "Modifier" : "Créer"}
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>

                {/* ── Delete confirm ── */}
                <GlassModal open={!!deleteGroup} onClose={() => setDeleteGroup(null)} title="Supprimer ce groupe ?">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <p className="text-sm text-gray-400">
                            Le groupe <strong className="text-white">{deleteGroup?.name}</strong> sera supprimé définitivement.
                            Les membres ne seront pas affectés.
                        </p>
                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                onClick={() => setDeleteGroup(null)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="px-5 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {deleteLoading ? "Suppression…" : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </GlassModal>

                {/* ── Add members modal ── */}
                <GlassModal open={addMembersOpen} onClose={() => setAddMembersOpen(false)} title="Ajouter des membres">
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher un membre…"
                                value={addMemberSearch}
                                onChange={(e) => setAddMemberSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                            />
                        </div>

                        {/* Member list */}
                        <div className="max-h-60 overflow-auto space-y-1">
                            {filteredAvailable.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-4">Aucun membre disponible.</p>
                            ) : (
                                filteredAvailable.map((m) => (
                                    <label
                                        key={m.id}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedNewMembers.includes(m.id)}
                                            onChange={(e) =>
                                                setSelectedNewMembers(
                                                    e.target.checked
                                                        ? [...selectedNewMembers, m.id]
                                                        : selectedNewMembers.filter((id) => id !== m.id)
                                                )
                                            }
                                            className="rounded accent-indigo-500"
                                        />
                                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold uppercase">
                                            {initials(m)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white">{memberName(m)}</p>
                                            <p className="text-xs text-gray-500">{m.email}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setAddMembersOpen(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <GlassButton
                                className="!w-auto px-6"
                                onClick={handleAddMembers}
                                disabled={addMembersLoading || selectedNewMembers.length === 0}
                            >
                                {addMembersLoading ? "Ajout…" : `Ajouter (${selectedNewMembers.length})`}
                            </GlassButton>
                        </div>
                    </div>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}
