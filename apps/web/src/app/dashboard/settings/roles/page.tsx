"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Shield,
    Plus,
    Pencil,
    Trash2,
    AlertTriangle,
    Lock,
    Check,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

interface Permission {
    key: string;
    label: string;
    group: string;
}

interface Role {
    id: string;
    name: string;
    slug: string;
    color: string;
    permissions: string[];
    isSystem: boolean;
    createdAt: string;
}

const COLOR_OPTIONS = [
    "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#f97316", "#84cc16",
];

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formColor, setFormColor] = useState("#6366f1");
    const [formPermissions, setFormPermissions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                apiGet("/roles"),
                apiGet("/roles/permissions"),
            ]);
            setRoles(rolesRes as Role[]);
            setAllPermissions(permsRes as Permission[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setEditingRole(null);
        setFormName("");
        setFormSlug("");
        setFormColor("#6366f1");
        setFormPermissions(["dashboard.view"]);
        setShowModal(true);
    }

    function openEdit(role: Role) {
        setEditingRole(role);
        setFormName(role.name);
        setFormSlug(role.slug);
        setFormColor(role.color);
        setFormPermissions([...role.permissions]);
        setShowModal(true);
    }

    function togglePermission(key: string) {
        setFormPermissions((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );
    }

    function toggleGroup(group: string) {
        const groupPerms = allPermissions.filter((p) => p.group === group).map((p) => p.key);
        const allChecked = groupPerms.every((k) => formPermissions.includes(k));
        if (allChecked) {
            setFormPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
        } else {
            setFormPermissions((prev) => [...new Set([...prev, ...groupPerms])]);
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingRole) {
                const updated = await apiPatch(`/roles/${editingRole.id}`, {
                    name: formName,
                    color: formColor,
                    permissions: formPermissions,
                }) as Role;
                setRoles((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r))
                );
            } else {
                const created = await apiPost("/roles", {
                    name: formName,
                    slug: formSlug,
                    color: formColor,
                    permissions: formPermissions,
                }) as Role;
                setRoles((prev) => [...prev, created]);
            }
            setShowModal(false);
        } catch (e: any) {
            alert(e.message || "Erreur");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await apiDelete(`/roles/${deleteTarget.id}`);
            setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e: any) {
            alert(e.message || "Erreur");
        }
    }

    // Slug auto-gen from name
    function autoSlug(name: string) {
        return name
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
    }

    // Group permissions by group
    const permissionGroups = allPermissions.reduce((acc, p) => {
        if (!acc[p.group]) acc[p.group] = [];
        acc[p.group].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (loading) return null;

    return (
        <RequirePermission permissions={["roles.manage"]}>
            <div className="max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-violet-400" />
                        <h2 className="text-xl font-bold text-white">
                            Gestion des rôles
                        </h2>
                        <span className="text-sm text-gray-500">({roles.length})</span>
                    </div>
                    <GlassButton onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau rôle
                    </GlassButton>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                        <GlassCard key={role.id} className="relative group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: role.color }}
                                    />
                                    <div>
                                        <h3 className="text-white font-semibold text-sm">
                                            {role.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                                            {role.slug}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {role.isSystem && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                            <Lock className="w-2.5 h-2.5" />
                                            Système
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Permission count */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-1">
                                        {role.permissions.slice(0, 4).map((p) => (
                                            <span
                                                key={p}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10"
                                            >
                                                {p.split(".")[0]}
                                            </span>
                                        ))}
                                        {role.permissions.length > 4 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                                                +{role.permissions.length - 4}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {role.permissions.length} permission{role.permissions.length > 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                                <button
                                    onClick={() => openEdit(role)}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <Pencil className="w-3 h-3" />
                                    Modifier
                                </button>
                                {!role.isSystem && (
                                    <button
                                        onClick={() => setDeleteTarget(role)}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors ml-auto cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Supprimer
                                    </button>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* ── Create / Edit Modal ── */}
                <GlassModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    title={editingRole ? `Modifier "${editingRole.name}"` : "Nouveau rôle"}
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <GlassInput
                                label="Nom du rôle"
                                placeholder="Trésorier adjoint"
                                value={formName}
                                onChange={(e) => {
                                    setFormName(e.target.value);
                                    if (!editingRole) setFormSlug(autoSlug(e.target.value));
                                }}
                                required
                            />
                            <GlassInput
                                label="Slug (identifiant)"
                                placeholder="TREASURER_ASSISTANT"
                                value={formSlug}
                                onChange={(e) => setFormSlug(e.target.value.toUpperCase())}
                                required
                                disabled={!!editingRole}
                            />
                        </div>

                        {/* Color picker */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-2">Couleur</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormColor(c)}
                                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${formColor === c
                                            ? "border-white scale-110"
                                            : "border-transparent hover:border-white/40"
                                            }`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {formColor === c && (
                                            <Check className="w-3.5 h-3.5 text-white mx-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Permissions grid */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-3">Permissions</label>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {Object.entries(permissionGroups).map(([group, perms]) => {
                                    const allChecked = perms.every((p) => formPermissions.includes(p.key));
                                    const someChecked = perms.some((p) => formPermissions.includes(p.key));

                                    return (
                                        <div key={group} className="bg-white/[0.03] rounded-lg border border-white/10 p-3">
                                            {/* Group header */}
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(group)}
                                                className="flex items-center gap-2 w-full text-left cursor-pointer"
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allChecked
                                                    ? "bg-violet-500 border-violet-500"
                                                    : someChecked
                                                        ? "bg-violet-500/30 border-violet-500/50"
                                                        : "border-white/20"
                                                    }`}>
                                                    {(allChecked || someChecked) && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold text-white/90">{group}</span>
                                                <span className="text-[10px] text-gray-500 ml-auto">
                                                    {perms.filter((p) => formPermissions.includes(p.key)).length}/{perms.length}
                                                </span>
                                            </button>

                                            {/* Individual permissions */}
                                            <div className="mt-2 ml-6 space-y-1.5">
                                                {perms.map((p) => {
                                                    const checked = formPermissions.includes(p.key);
                                                    return (
                                                        <button
                                                            key={p.key}
                                                            type="button"
                                                            onClick={() => togglePermission(p.key)}
                                                            className="flex items-center gap-2 w-full text-left cursor-pointer"
                                                        >
                                                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${checked
                                                                ? "bg-blue-500 border-blue-500"
                                                                : "border-white/20"
                                                                }`}>
                                                                {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                            <span className="text-xs text-gray-300">{p.label}</span>
                                                            <span className="text-[10px] text-gray-600 ml-auto font-mono">{p.key}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <GlassButton type="submit" disabled={saving} className="w-full">
                            {saving ? "Enregistrement..." : editingRole ? "Mettre à jour" : "Créer le rôle"}
                        </GlassButton>
                    </form>
                </GlassModal>

                {/* ── Delete Confirmation ── */}
                <GlassModal
                    open={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    title="Supprimer ce rôle"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-300">
                                    Vous allez supprimer le rôle <strong className="text-white">{deleteTarget?.name}</strong>.
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Les utilisateurs avec ce rôle seront réassignés au rôle « Membre ».
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors cursor-pointer"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}
