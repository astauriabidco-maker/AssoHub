"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Plus, Users2, User, MoreHorizontal, Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GroupMember {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    leader?: GroupMember | null;
    members: GroupMember[];
    _count?: {
        members: number;
    };
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    const fetchGroups = async () => {
        try {
            const data = await apiFetch("/groups");
            setGroups(data);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch("/groups", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            setIsCreateModalOpen(false);
            setFormData({ name: "", description: "" });
            fetchGroups();
        } catch (error) {
            console.error("Failed to create group:", error);
            alert("Une erreur est survenue lors de la création du groupe.");
        } finally {
            setSubmitting(false);
        }
    };

    const getInitials = (member: GroupMember | null | undefined) => {
        if (!member) return "?";
        if (member.firstName && member.lastName) {
            return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
        }
        return member.email[0].toUpperCase();
    };

    const getFullName = (member: GroupMember | null | undefined) => {
        if (!member) return "Non défini";
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        return member.email;
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Groupes & Commissions</h1>
                        <p className="text-white/60 mt-1">Organisez vos membres en sous-groupes</p>
                    </div>
                    <button
                        onClick={() => { setFormData({ name: "", description: "" }); setIsCreateModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Créer un groupe
                    </button>
                </div>

                {/* Groups Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <GlassCard key={i} className="p-6">
                                <Skeleton className="h-6 w-40 mb-4" />
                                <Skeleton className="h-4 w-full mb-6" />
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <Users2 size={48} className="mx-auto text-white/20 mb-4" />
                        <h3 className="text-lg font-semibold text-white/60 mb-2">Aucun groupe créé</h3>
                        <p className="text-white/40 text-sm mb-6">Créez votre premier groupe pour organiser vos membres.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-medium"
                        >
                            Créer un groupe
                        </button>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                                <GlassCard className="p-6 hover:border-primary/30 transition-all cursor-pointer group">
                                    {/* Header with gradient */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                {group.name}
                                            </h3>
                                            {group.description && (
                                                <p className="text-white/50 text-sm mt-1 line-clamp-2">{group.description}</p>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="shrink-0">
                                            {group._count?.members || group.members.length} membre{(group._count?.members || group.members.length) > 1 ? "s" : ""}
                                        </Badge>
                                    </div>

                                    {/* Leader section */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold border text-sm",
                                            group.leader
                                                ? "bg-primary/20 text-primary border-primary/20"
                                                : "bg-white/10 text-white/40 border-white/10"
                                        )}>
                                            {getInitials(group.leader)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white/40 uppercase tracking-wider">Responsable</p>
                                            <p className="text-sm font-medium text-white truncate">
                                                {getFullName(group.leader)}
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal: Créer un groupe */}
            <Dialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Créer un groupe"
            >
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Nom du groupe</label>
                        <input
                            type="text"
                            required
                            placeholder="ex: Commission Finance, Bureau, Section Jeunes..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Description (optionnelle)</label>
                        <textarea
                            rows={3}
                            placeholder="Décrivez le rôle de ce groupe..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={18} className="animate-spin" />}
                        Créer le groupe
                    </button>
                </form>
            </Dialog>
        </div>
    );
}
