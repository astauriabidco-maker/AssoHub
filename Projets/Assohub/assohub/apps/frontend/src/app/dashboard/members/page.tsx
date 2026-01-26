"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Mail, User as UserIcon, MoreHorizontal, Loader2, Eye, Edit, Shield, CheckCircle, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Fee {
    id: string;
    amount: number;
    status: string;
    campaign: {
        name: string;
        amount: number;
    };
    createdAt: string;
}

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    status: string;
    fees?: Fee[];
}

export default function MembersPage() {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "MEMBER",
    });

    const fetchMembers = async () => {
        try {
            const data = await apiFetch("/users");
            setMembers(data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberDetails = async (id: string) => {
        try {
            const data = await apiFetch(`/users/${id}`);
            setSelectedMember(data);
            setIsDetailsModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch member details:", error);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch("/users", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            setIsAddModalOpen(false);
            resetForm();
            fetchMembers();
        } catch (error) {
            console.error("Failed to add member:", error);
            alert("Une erreur est survenue lors de l'ajout du membre.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { id, ...updateData } = formData;
            await apiFetch(`/users/${id}`, {
                method: "PATCH",
                body: JSON.stringify(updateData),
            });
            setIsEditModalOpen(false);
            resetForm();
            fetchMembers();
        } catch (error) {
            console.error("Failed to update member:", error);
            alert("Une erreur est survenue lors de la modification.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ id: "", email: "", firstName: "", lastName: "", role: "MEMBER" });
    };

    const openEditModal = (member: User) => {
        setFormData({
            id: member.id,
            email: member.email,
            firstName: member.firstName || "",
            lastName: member.lastName || "",
            role: member.role,
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;
        try {
            await apiFetch(`/users/${id}`, { method: "DELETE" });
            fetchMembers();
        } catch (error) {
            console.error("Failed to delete member:", error);
        }
    };

    const getInitials = (user: User | { firstName?: string; lastName?: string; email: string }) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return user.email[0].toUpperCase();
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Membres</h1>
                        <p className="text-white/60 mt-1">Gérez les membres et inspectez leurs finances</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Ajouter un membre
                    </button>
                </div>

                {/* Members Table Card */}
                <GlassCard>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Membre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Rôle</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-10 w-40" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : members.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                                            Aucun membre trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member) => (
                                        <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                        {getInitials(member)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                        <div className="text-xs text-white/40">{member.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white/70">
                                                {member.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={member.role === 'ADMIN' ? 'primary' : 'secondary'}>
                                                    {member.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={member.status === 'ACTIVE' ? 'success' : 'warning'}>
                                                    {member.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => fetchMemberDetails(member.id)}
                                                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                        title="Détails"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                        title="Modifier"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMember(member.id)}
                                                        className="p-2 text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="group-hover:hidden">
                                                    <MoreHorizontal size={16} className="text-white/20 ml-auto" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* Modal: Ajouter / Modifier */}
            <Dialog
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isEditModalOpen ? "Modifier le membre" : "Ajouter un membre"}
            >
                <form onSubmit={isEditModalOpen ? handleUpdateMember : handleAddMember} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Prénom</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Nom</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Rôle</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="MEMBER" className="bg-slate-900">Membre</option>
                            <option value="ADMIN" className="bg-slate-900">Administrateur</option>
                            <option value="TREASURER" className="bg-slate-900">Trésorier</option>
                            <option value="SECRETARY" className="bg-slate-900">Secrétaire</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={18} className="animate-spin" />}
                        {isEditModalOpen ? "Enregistrer les modifications" : "Ajouter le membre"}
                    </button>
                </form>
            </Dialog>

            {/* Modal: Détails Membre */}
            <Dialog
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title="Détails du membre"
            >
                {selectedMember && (
                    <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold border border-primary/20">
                                {getInitials(selectedMember)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedMember.firstName} {selectedMember.lastName}</h3>
                                <p className="text-white/50 text-sm flex items-center gap-1">
                                    <Mail size={14} /> {selectedMember.email}
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <Badge variant="secondary">{selectedMember.role}</Badge>
                                    <Badge variant="success">{selectedMember.status}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Finances Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                <Shield size={16} /> Finances & Cotisations
                            </h4>
                            <div className="space-y-2">
                                {selectedMember.fees && selectedMember.fees.length > 0 ? (
                                    selectedMember.fees.map((fee) => (
                                        <div key={fee.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                            <div>
                                                <p className="text-sm font-medium text-white">{fee.campaign.name}</p>
                                                <p className="text-[10px] text-white/30">{new Date(fee.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-white">{fee.campaign.amount} €</span>
                                                <Badge variant={fee.status === 'PAID' ? 'success' : 'warning'} className="min-w-[80px] justify-center">
                                                    {fee.status === 'PAID' ? (
                                                        <span className="flex items-center gap-1"><CheckCircle size={10} /> PAYÉ</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><Clock size={10} /> EN ATTENTE</span>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-white/20 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        Aucune cotisation enregistrée.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
