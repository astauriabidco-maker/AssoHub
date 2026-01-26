"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
    ShieldCheck,
    Users,
    Activity,
    Calendar,
    Search,
    RefreshCcw,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Association {
    id: string;
    name: string;
    subscription_plan: string;
    is_active: boolean;
    createdAt: string;
    _count: {
        users: number;
    };
}

export default function SuperAdminPage() {
    const [associations, setAssociations] = useState<Association[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchAssociations = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch("/associations");
            setAssociations(data);
        } catch (err: any) {
            setError(err.message || "Erreur lors du chargement des associations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssociations();
    }, []);

    const toggleStatus = async (id: string) => {
        try {
            await apiFetch(`/associations/${id}/toggle-status`, { method: "PATCH" });
            setAssociations(prev => prev.map(a =>
                a.id === id ? { ...a, is_active: !a.is_active } : a
            ));
        } catch (err: any) {
            alert(err.message || "Erreur lors de la modification du statut");
        }
    };

    const filteredAssociations = associations.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-primary" size={40} />
                        Administration Plateforme
                    </h1>
                    <p className="text-white/40 mt-2 font-medium">Gestion globale des associations Assohub</p>
                </div>
                <button
                    onClick={fetchAssociations}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-all border border-white/10 disabled:opacity-50"
                >
                    <RefreshCcw size={18} className={cn(loading && "animate-spin")} />
                    Actualiser
                </button>
            </div>

            {/* Search and Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une association..."
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <GlassCard className="flex items-center justify-between p-6">
                    <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Total Associations</p>
                        <p className="text-3xl font-black text-white mt-1">{associations.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                        <Activity className="text-primary" size={24} />
                    </div>
                </GlassCard>
            </div>

            {error ? (
                <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl border border-destructive/20 space-y-4">
                    <AlertCircle size={48} className="text-destructive" />
                    <p className="text-white/60 font-medium text-lg">{error}</p>
                    <button
                        onClick={fetchAssociations}
                        className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all"
                    >
                        Réessayer
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAssociations.map((association) => (
                        <GlassCard key={association.id} className="p-6 group hover:translate-y-[-4px] transition-all duration-300 border-white/5 hover:border-primary/30">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{association.name}</h3>
                                        <Badge variant={association.is_active ? "success" : "destructive"}>
                                            {association.is_active ? "Actif" : "Suspendu"}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-white/40 text-sm italic">
                                            <Users size={16} className="text-primary/60" />
                                            <span>{association._count.users} Utilisateurs</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40 text-sm italic">
                                            <Calendar size={16} className="text-primary/60" />
                                            <span>Créé le {new Date(association.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-white/20 text-[10px] font-mono">
                                        ID: {association.id}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => toggleStatus(association.id)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                            association.is_active
                                                ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                                                : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                        )}
                                    >
                                        {association.is_active ? "Suspendre" : "Activer"}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
