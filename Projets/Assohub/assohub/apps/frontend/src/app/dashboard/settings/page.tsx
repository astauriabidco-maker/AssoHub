"use client";

import React, { useEffect, useState } from "react";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    Users,
    Save,
    Loader2,
    ShieldAlert,
    UserPlus,
    Camera
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface Association {
    id: string;
    name: string;
    slogan?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    address_street?: string;
    address_city?: string;
    address_zip?: string;
    address_country?: string;
    legal_form?: string;
    is_active: boolean;
    users: TeamMember[];
}

export default function SettingsPage() {
    const [association, setAssociation] = useState<Association | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<any>({});

    const fetchData = async () => {
        try {
            const data = await apiFetch("/associations/me");
            setAssociation(data);
            setFormData(data);
        } catch (error) {
            console.error("Failed to fetch association settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Filter out relations and IDs before sending
            const { users, id, createdAt, updatedAt, ...payload } = formData;
            await apiFetch("/associations/me", {
                method: "PATCH",
                body: JSON.stringify(payload)
            });
            alert("Paramètres enregistrés avec succès !");
            fetchData();
        } catch (error) {
            console.error("Save error:", error);
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-primary mx-auto" /></div>;
    if (!association) return <div className="p-8 text-white">Erreur de chargement.</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Paramètres</h1>
                <p className="text-white/60 mt-1">Configurez l'identité et les accès de votre association</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* Identité & Coordonnées */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-primary" size={20} />
                            <h2 className="text-xl font-bold text-white">Identité & Coordonnées</h2>
                        </div>

                        <div className="flex flex-col items-center py-4">
                            <div className="relative group">
                                <div className="w-24 h-24 bg-primary/20 border-2 border-primary/50 rounded-full flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
                                    {formData.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <button type="button" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                    <Camera size={16} />
                                </button>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase mt-2 tracking-widest font-bold">Logo de l'asso</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Nom</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.name || ""}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Slogan</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.slogan || ""}
                                    onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Email Contact</label>
                                <input
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.contact_email || ""}
                                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Téléphone</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.contact_phone || ""}
                                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-white/60 font-bold uppercase tracking-widest">
                                <MapPin size={14} /> Adresse Siège
                            </div>
                            <input
                                placeholder="Rue / Avenue"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.address_street || ""}
                                onChange={e => setFormData({ ...formData, address_street: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Ville"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.address_city || ""}
                                    onChange={e => setFormData({ ...formData, address_city: e.target.value })}
                                />
                                <input
                                    placeholder="Code Postal"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.address_zip || ""}
                                    onChange={e => setFormData({ ...formData, address_zip: e.target.value })}
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Actions */}
                    <button
                        disabled={saving}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Enregistrer toutes les modifications
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Informations Légales */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="text-emerald-400" size={20} />
                            <h2 className="text-xl font-bold text-white">Informations Légales</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Forme Juridique</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.legal_form || ""}
                                    onChange={e => setFormData({ ...formData, legal_form: e.target.value })}
                                >
                                    <option value="Association Loi 1901" className="text-black">Association Loi 1901</option>
                                    <option value="Association Alsacienne-Mosellane" className="text-black">Association Alsacienne-Mosellane</option>
                                    <option value="ONG" className="text-black">ONG</option>
                                    <option value="Fondation" className="text-black">Fondation</option>
                                    <option value="Autre" className="text-black">Autre</option>
                                </select>
                            </div>

                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white">Statut du Compte</p>
                                    <p className="text-[10px] text-white/40">Géré par l'administration système</p>
                                </div>
                                <Badge variant={association.is_active ? "primary" : "destructive"}>
                                    {association.is_active ? "ACTIF" : "SUSPENDU"}
                                </Badge>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Gestion de l'équipe */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Users className="text-orange-400" size={20} />
                                <h2 className="text-xl font-bold text-white">Gestion de l'équipe</h2>
                            </div>
                            <button type="button" className="p-2 bg-orange-400/10 text-orange-400 rounded-full hover:bg-orange-400/20 transition-colors">
                                <UserPlus size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {association.users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-white/40 group-hover:text-primary transition-colors">
                                            {user.firstName[0]}{user.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{user.firstName} {user.lastName}</p>
                                            <p className="text-[10px] text-white/40">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[9px]">{user.role}</Badge>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
                            <ShieldAlert className="text-rose-500 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-tighter">Zone de Danger</p>
                                <p className="text-[10px] text-rose-500/70">La suppression d'un administrateur est irréversible.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </form>
        </div>
    );
}
