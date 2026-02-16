"use client";

import { useState, type FormEvent } from "react";
import {
    UserCircle,
    Mail,
    Shield,
    Calendar,
    Pencil,
    Check,
    X,
    User,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import { useAuth } from "@/hooks/useAuth";
import { apiPatch } from "@/lib/api";

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    SUPER_ADMIN: "bg-red-500/20 text-red-300 border-red-500/30",
    TREASURER: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    SECRETARY: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    MEMBER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    PRESIDENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrateur",
    SUPER_ADMIN: "Super Admin",
    TREASURER: "Trésorier",
    SECRETARY: "Secrétaire",
    MEMBER: "Membre",
    PRESIDENT: "Président",
};

export default function ProfilePage() {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!user) return null;

    const initials =
        (user.firstName?.[0] || "") + (user.lastName?.[0] || user.email[0] || "");
    const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    function startEdit() {
        setForm({
            firstName: user!.firstName || "",
            lastName: user!.lastName || "",
        });
        setEditing(true);
        setSuccess(false);
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await apiPatch(`/users/${user!.id}`, form);
            // Update localStorage
            const updatedUser = { ...user, ...form };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            // Reload for sidebar update
            window.location.reload();
        } catch {
            // silent
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-400" />
                Mon Espace
            </h2>

            {/* Profile Card */}
            <GlassCard className="!p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg shadow-blue-500/20">
                        {initials}
                    </div>

                    {/* Name & Email */}
                    <div>
                        <h3 className="text-2xl font-bold text-white">{fullName}</h3>
                        <div className="flex items-center justify-center gap-2 mt-1.5 text-gray-400 text-sm">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                        </div>
                    </div>

                    {/* Role badge */}
                    <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER
                            }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        {ROLE_LABELS[user.role] || user.role}
                    </span>
                </div>
            </GlassCard>

            {/* Info & Edit */}
            <GlassCard>
                <div className="flex items-center justify-between mb-5">
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        Informations personnelles
                    </h4>
                    {!editing && (
                        <button
                            onClick={startEdit}
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                        </button>
                    )}
                </div>

                {success && (
                    <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg p-3">
                        <Check className="w-4 h-4" />
                        Profil mis à jour avec succès !
                    </div>
                )}

                {editing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput
                                label="Prénom"
                                placeholder="Votre prénom"
                                icon={<User className="w-4 h-4" />}
                                value={form.firstName}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, firstName: e.target.value }))
                                }
                            />
                            <GlassInput
                                label="Nom"
                                placeholder="Votre nom"
                                icon={<User className="w-4 h-4" />}
                                value={form.lastName}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, lastName: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <GlassButton type="submit" isLoading={saving} icon={<Check className="w-4 h-4" />}>
                                Enregistrer
                            </GlassButton>
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Annuler
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-gray-400">Prénom</span>
                            <span className="text-sm text-white font-medium">
                                {user.firstName || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-gray-400">Nom</span>
                            <span className="text-sm text-white font-medium">
                                {user.lastName || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2.5 border-b border-white/5">
                            <span className="text-sm text-gray-400">Email</span>
                            <span className="text-sm text-white font-medium">
                                {user.email}
                            </span>
                        </div>
                        <div className="flex justify-between py-2.5">
                            <span className="text-sm text-gray-400">Rôle</span>
                            <span className="text-sm text-white font-medium">
                                {ROLE_LABELS[user.role] || user.role}
                            </span>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
