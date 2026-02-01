"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Plus, Trash2, Mail, MoreHorizontal, Loader2, Eye, Edit,
    Shield, CheckCircle, Clock, Upload, FileText, AlertTriangle,
    History, User as UserIcon, Ban, UserCheck
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch, API_BASE_URL } from "@/lib/api";
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

interface HistoryEntry {
    id: string;
    action: string;
    description?: string;
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
    history?: HistoryEntry[];
}

const ROLE_OPTIONS = [
    { value: "PRESIDENT", label: "Président" },
    { value: "VICE_PRESIDENT", label: "Vice-Président" },
    { value: "SECRETARY", label: "Secrétaire" },
    { value: "TREASURER", label: "Trésorier" },
    { value: "MEMBER", label: "Membre" },
];

const ROLE_LABELS: Record<string, string> = {
    PRESIDENT: "Président",
    VICE_PRESIDENT: "Vice-Président",
    SECRETARY: "Secrétaire",
    TREASURER: "Trésorier",
    MEMBER: "Membre",
};

export default function MembersPage() {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
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
            setActiveTab("profile");
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
            // Refresh selected member if details are open
            if (selectedMember && selectedMember.id === id) {
                fetchMemberDetails(id);
            }
        } catch (error) {
            console.error("Failed to update member:", error);
            alert("Une erreur est survenue lors de la modification.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedMember) return;
        const newStatus = selectedMember.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        const confirmMsg = newStatus === "SUSPENDED"
            ? "Voulez-vous vraiment suspendre ce membre ?"
            : "Voulez-vous réactiver ce membre ?";
        if (!confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            await apiFetch(`/users/${selectedMember.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            fetchMemberDetails(selectedMember.id);
            fetchMembers();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleImportCsv = async () => {
        if (!importFile) return;
        setSubmitting(true);
        setImportResult(null);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", importFile);

            const token = typeof window !== "undefined" ? localStorage.getItem("assohub_token") : null;
            const response = await fetch(`${API_BASE_URL}/users/import`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formDataUpload,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            setImportResult(result);
            fetchMembers();
        } catch (error) {
            console.error("Import failed:", error);
            alert("Erreur lors de l'import: " + (error as Error).message);
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

    const getInitials = (user: { firstName?: string; lastName?: string; email: string }) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return user.email[0].toUpperCase();
    };

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
            setImportFile(file);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setImportFile(file);
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
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setImportFile(null); setImportResult(null); setIsImportModalOpen(true); }}
                            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full border border-white/10 transition-all active:scale-95"
                        >
                            <Upload size={18} />
                            Importer (CSV)
                        </button>
                        <button
                            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Ajouter un membre
                        </button>
                    </div>
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
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold border",
                                                        member.status === "SUSPENDED"
                                                            ? "bg-red-500/20 text-red-400 border-red-500/20"
                                                            : "bg-primary/20 text-primary border-primary/20"
                                                    )}>
                                                        {getInitials(member)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                        <div className="text-xs text-white/40">{ROLE_LABELS[member.role] || member.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white/70">
                                                {member.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={["PRESIDENT", "VICE_PRESIDENT"].includes(member.role) ? "primary" : "secondary"}>
                                                    {ROLE_LABELS[member.role] || member.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={member.status === "ACTIVE" ? "success" : member.status === "SUSPENDED" ? "destructive" : "warning"}>
                                                    {member.status === "SUSPENDED" ? "Suspendu" : member.status}
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

            {/* Modal: Import CSV */}
            <Dialog
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Importer des membres (CSV)"
            >
                <div className="space-y-4">
                    {importResult ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle size={32} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">Import terminé !</p>
                                <p className="text-white/60 text-sm mt-1">
                                    {importResult.imported} membre(s) importé(s), {importResult.skipped} ignoré(s)
                                </p>
                            </div>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-6 py-2 bg-primary text-white rounded-xl font-medium"
                            >
                                Fermer
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                                className={cn(
                                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all",
                                    importFile
                                        ? "border-primary bg-primary/10"
                                        : "border-white/20 hover:border-white/40"
                                )}
                            >
                                {importFile ? (
                                    <div className="space-y-2">
                                        <FileText size={40} className="mx-auto text-primary" />
                                        <p className="text-white font-medium">{importFile.name}</p>
                                        <button
                                            onClick={() => setImportFile(null)}
                                            className="text-xs text-white/50 hover:text-white underline"
                                        >
                                            Changer de fichier
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Upload size={40} className="mx-auto text-white/30" />
                                        <div>
                                            <p className="text-white/70">Glissez-déposez votre fichier CSV ici</p>
                                            <p className="text-white/40 text-sm">ou</p>
                                        </div>
                                        <label className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-all">
                                            Parcourir
                                            <input
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 text-xs text-white/50">
                                <p className="font-semibold text-white/70 mb-1">Format attendu :</p>
                                <code className="block bg-black/20 p-2 rounded">email,firstName,lastName,role</code>
                                <p className="mt-2">Rôles : PRESIDENT, VICE_PRESIDENT, SECRETARY, TREASURER, MEMBER</p>
                            </div>

                            <button
                                onClick={handleImportCsv}
                                disabled={!importFile || submitting}
                                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={18} className="animate-spin" />}
                                Importer
                            </button>
                        </>
                    )}
                </div>
            </Dialog>

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
                            {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-slate-900">
                                    {opt.label}
                                </option>
                            ))}
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

            {/* Modal: Détails Membre avec Onglets */}
            <Dialog
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title="Détails du membre"
            >
                {selectedMember && (
                    <div className="space-y-5">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border",
                                selectedMember.status === "SUSPENDED"
                                    ? "bg-red-500/20 text-red-400 border-red-500/20"
                                    : "bg-primary/20 text-primary border-primary/20"
                            )}>
                                {getInitials(selectedMember)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white">{selectedMember.firstName} {selectedMember.lastName}</h3>
                                <p className="text-white/50 text-sm flex items-center gap-1">
                                    <Mail size={14} /> {selectedMember.email}
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <Badge variant="secondary">{ROLE_LABELS[selectedMember.role] || selectedMember.role}</Badge>
                                    <Badge variant={selectedMember.status === "ACTIVE" ? "success" : "destructive"}>
                                        {selectedMember.status === "SUSPENDED" ? "Suspendu" : selectedMember.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-white/10 pb-1">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2",
                                    activeTab === "profile"
                                        ? "bg-white/10 text-white"
                                        : "text-white/50 hover:text-white"
                                )}
                            >
                                <UserIcon size={16} /> Profil
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2",
                                    activeTab === "history"
                                        ? "bg-white/10 text-white"
                                        : "text-white/50 hover:text-white"
                                )}
                            >
                                <History size={16} /> Historique
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "profile" && (
                            <div className="space-y-5">
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
                                                        <Badge variant={fee.status === "PAID" ? "success" : "warning"} className="min-w-[80px] justify-center">
                                                            {fee.status === "PAID" ? (
                                                                <span className="flex items-center gap-1"><CheckCircle size={10} /> PAYÉ</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1"><Clock size={10} /> EN ATTENTE</span>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-white/20 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                                Aucune cotisation enregistrée.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Zone de Danger */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle size={16} /> Zone de Danger
                                    </h4>
                                    <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {selectedMember.status === "SUSPENDED" ? "Réactiver le membre" : "Suspendre le membre"}
                                            </p>
                                            <p className="text-xs text-white/50">
                                                {selectedMember.status === "SUSPENDED"
                                                    ? "Ce membre pourra à nouveau accéder à l'application."
                                                    : "Le membre ne pourra plus accéder à l'application."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleToggleStatus}
                                            disabled={submitting}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                                                selectedMember.status === "SUSPENDED"
                                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            )}
                                        >
                                            {submitting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : selectedMember.status === "SUSPENDED" ? (
                                                <><UserCheck size={16} /> Réactiver</>
                                            ) : (
                                                <><Ban size={16} /> Suspendre</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="space-y-3">
                                {selectedMember.history && selectedMember.history.length > 0 ? (
                                    <div className="relative pl-6 space-y-4">
                                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/10" />
                                        {selectedMember.history.map((entry, index) => (
                                            <div key={entry.id} className="relative">
                                                <div className="absolute -left-4 top-1 w-3 h-3 bg-primary rounded-full border-2 border-slate-900" />
                                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                    <p className="text-sm text-white">{entry.description || entry.action}</p>
                                                    <p className="text-xs text-white/40 mt-1">
                                                        {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-white/20 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        Aucun historique disponible.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    );
}
