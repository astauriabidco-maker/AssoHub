"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, User, UserPlus, UserMinus, Crown, Loader2, Edit2, Trash2, Check, X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role?: string;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    leader?: Member | null;
    members: Member[];
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isChangeLeaderModalOpen, setIsChangeLeaderModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "" });

    const fetchGroup = async () => {
        try {
            const data = await apiFetch(`/groups/${id}`);
            setGroup(data);
            setFormData({ name: data.name, description: data.description || "" });
        } catch (error) {
            console.error("Failed to fetch group:", error);
            router.push("/dashboard/groups");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllMembers = async () => {
        try {
            const data = await apiFetch("/users");
            setAllMembers(data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        }
    };

    useEffect(() => {
        fetchGroup();
        fetchAllMembers();
    }, [id]);

    const handleAddMembers = async () => {
        setSubmitting(true);
        try {
            for (const userId of selectedMemberIds) {
                await apiFetch(`/groups/${id}/members`, {
                    method: "POST",
                    body: JSON.stringify({ userId }),
                });
            }
            setIsAddMemberModalOpen(false);
            setSelectedMemberIds([]);
            fetchGroup();
        } catch (error) {
            console.error("Failed to add members:", error);
            alert("Une erreur est survenue lors de l'ajout des membres.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Retirer ce membre du groupe ?")) return;
        try {
            await apiFetch(`/groups/${id}/members/${userId}`, { method: "DELETE" });
            fetchGroup();
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const handleSetLeader = async (userId: string) => {
        setSubmitting(true);
        try {
            await apiFetch(`/groups/${id}/leader`, {
                method: "PATCH",
                body: JSON.stringify({ userId }),
            });
            setIsChangeLeaderModalOpen(false);
            fetchGroup();
        } catch (error) {
            console.error("Failed to set leader:", error);
            alert("Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateGroup = async () => {
        setSubmitting(true);
        try {
            await apiFetch(`/groups/${id}`, {
                method: "PATCH",
                body: JSON.stringify(formData),
            });
            setEditMode(false);
            fetchGroup();
        } catch (error) {
            console.error("Failed to update group:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.")) return;
        try {
            await apiFetch(`/groups/${id}`, { method: "DELETE" });
            router.push("/dashboard/groups");
        } catch (error) {
            console.error("Failed to delete group:", error);
        }
    };

    const getInitials = (member: Member | null | undefined) => {
        if (!member) return "?";
        if (member.firstName && member.lastName) {
            return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
        }
        return member.email[0].toUpperCase();
    };

    const getFullName = (member: Member | null | undefined) => {
        if (!member) return "Non défini";
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        return member.email;
    };

    const availableMembers = allMembers.filter(
        (m) => !group?.members.some((gm) => gm.id === m.id)
    );

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Back button */}
                <button
                    onClick={() => router.push("/dashboard/groups")}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                    Retour aux groupes
                </button>

                {/* Header Card */}
                <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {editMode ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="text-2xl font-bold bg-transparent border-b border-white/20 focus:border-primary outline-none text-white w-full pb-1"
                                    />
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Description..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none resize-none"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdateGroup}
                                            disabled={submitting}
                                            className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2"
                                        >
                                            <Check size={16} />
                                            Enregistrer
                                        </button>
                                        <button
                                            onClick={() => setEditMode(false)}
                                            className="px-4 py-2 bg-white/10 text-white/60 rounded-lg font-medium flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-white">{group.name}</h1>
                                    {group.description && (
                                        <p className="text-white/60 mt-1">{group.description}</p>
                                    )}
                                </>
                            )}
                        </div>
                        {!editMode && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={handleDeleteGroup}
                                    className="p-2 rounded-lg bg-destructive/10 text-destructive/60 hover:bg-destructive/20 hover:text-destructive transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Leader Card */}
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center font-bold border text-lg",
                                group.leader
                                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : "bg-white/10 text-white/40 border-white/10"
                            )}>
                                {group.leader ? <Crown size={24} /> : <User size={24} />}
                            </div>
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Responsable du groupe</p>
                                <p className="text-lg font-semibold text-white">{getFullName(group.leader)}</p>
                                {group.leader?.email && (
                                    <p className="text-sm text-white/50">{group.leader.email}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChangeLeaderModalOpen(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 font-medium rounded-xl transition-colors"
                        >
                            Changer
                        </button>
                    </div>
                </GlassCard>

                {/* Members Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">
                            Membres du groupe
                            <Badge variant="secondary" className="ml-3">{group.members.length}</Badge>
                        </h2>
                        <button
                            onClick={() => setIsAddMemberModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all"
                        >
                            <UserPlus size={18} />
                            Ajouter des membres
                        </button>
                    </div>

                    <GlassCard className="overflow-hidden">
                        {group.members.length === 0 ? (
                            <div className="p-8 text-center">
                                <User size={40} className="mx-auto text-white/20 mb-3" />
                                <p className="text-white/50">Aucun membre dans ce groupe</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase">Membre</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase">Email</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-white/50 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.members.map((member) => (
                                        <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border",
                                                        group.leader?.id === member.id
                                                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                            : "bg-primary/20 text-primary border-primary/20"
                                                    )}>
                                                        {getInitials(member)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{getFullName(member)}</p>
                                                        {group.leader?.id === member.id && (
                                                            <Badge variant="secondary" className="text-amber-400 bg-amber-500/20 mt-1">
                                                                Responsable
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white/60">{member.email}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="p-2 rounded-lg text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                    title="Retirer du groupe"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Modal: Ajouter des membres */}
            <Dialog
                isOpen={isAddMemberModalOpen}
                onClose={() => { setIsAddMemberModalOpen(false); setSelectedMemberIds([]); }}
                title="Ajouter des membres"
            >
                <div className="space-y-4">
                    {availableMembers.length === 0 ? (
                        <p className="text-white/50 text-center py-4">Tous les membres sont déjà dans ce groupe.</p>
                    ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {availableMembers.map((member) => (
                                <label
                                    key={member.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                                        selectedMemberIds.includes(member.id)
                                            ? "bg-primary/20 border border-primary/30"
                                            : "bg-white/5 hover:bg-white/10 border border-transparent"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMemberIds.includes(member.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMemberIds([...selectedMemberIds, member.id]);
                                            } else {
                                                setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.id));
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                        {getInitials(member)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{getFullName(member)}</p>
                                        <p className="text-xs text-white/50">{member.email}</p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                        selectedMemberIds.includes(member.id)
                                            ? "bg-primary border-primary"
                                            : "border-white/30"
                                    )}>
                                        {selectedMemberIds.includes(member.id) && <Check size={12} className="text-white" />}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                    {availableMembers.length > 0 && (
                        <button
                            onClick={handleAddMembers}
                            disabled={submitting || selectedMemberIds.length === 0}
                            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 size={18} className="animate-spin" />}
                            Ajouter {selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : ""}
                        </button>
                    )}
                </div>
            </Dialog>

            {/* Modal: Changer le responsable */}
            <Dialog
                isOpen={isChangeLeaderModalOpen}
                onClose={() => setIsChangeLeaderModalOpen(false)}
                title="Choisir un responsable"
            >
                <div className="space-y-4">
                    {group.members.length === 0 ? (
                        <p className="text-white/50 text-center py-4">Ajoutez d'abord des membres au groupe.</p>
                    ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {group.members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSetLeader(member.id)}
                                    disabled={submitting}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl w-full transition-colors text-left",
                                        group.leader?.id === member.id
                                            ? "bg-amber-500/20 border border-amber-500/30"
                                            : "bg-white/5 hover:bg-white/10 border border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                        group.leader?.id === member.id
                                            ? "bg-amber-500/30 text-amber-400"
                                            : "bg-primary/20 text-primary"
                                    )}>
                                        {getInitials(member)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{getFullName(member)}</p>
                                        <p className="text-xs text-white/50">{member.email}</p>
                                    </div>
                                    {group.leader?.id === member.id && (
                                        <Crown size={18} className="text-amber-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
