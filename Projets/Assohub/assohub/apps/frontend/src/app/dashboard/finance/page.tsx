"use client";

import React, { useEffect, useState } from "react";
import { Plus, Wallet, TrendingUp, AlertCircle, Calendar, Users, Loader2, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Campaign {
    id: string;
    name: string;
    amount: number;
    due_date: string;
    _count: {
        fees: number;
    };
}

interface Stats {
    totalCollectable: number;
    totalReceived: number;
    remaining: number;
}

export default function FinancePage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<Stats>({ totalCollectable: 0, totalReceived: 0, remaining: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        dueDate: "",
    });

    const fetchData = async () => {
        try {
            const [campaignsData, statsData] = await Promise.all([
                apiFetch("/finance/campaigns"),
                apiFetch("/finance/stats"),
            ]);
            setCampaigns(campaignsData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch finance data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch("/finance/campaigns", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                }),
            });
            setIsModalOpen(false);
            setFormData({ name: "", amount: "", dueDate: "" });
            fetchData();
        } catch (error) {
            console.error("Failed to create campaign:", error);
            alert("Erreur lors du lancement de la campagne.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Finance</h1>
                        <p className="text-white/60 mt-1">Gérez vos appels de fonds et cotisations</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Lancer une campagne
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/50">Total à collecter</p>
                                <h3 className="text-2xl font-bold text-white mt-1">
                                    {loading ? <Skeleton className="h-8 w-24" /> : `${stats.totalCollectable} €`}
                                </h3>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <Wallet size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                            <TrendingUp size={14} />
                            <span>Attendu pour l'année</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/50">Reçu</p>
                                <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                                    {loading ? <Skeleton className="h-8 w-24" /> : `${stats.totalReceived} €`}
                                </h3>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <ArrowUpRight size={24} />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-white/5 rounded-full h-1.5">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${stats.totalCollectable > 0 ? (stats.totalReceived / stats.totalCollectable) * 100 : 0}%` }}
                            />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/50">Reste à percevoir</p>
                                <h3 className="text-2xl font-bold text-amber-400 mt-1">
                                    {loading ? <Skeleton className="h-8 w-24" /> : `${stats.remaining} €`}
                                </h3>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                                <AlertCircle size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                            <Users size={14} />
                            <span>{campaigns.length} campagnes actives</span>
                        </div>
                    </GlassCard>
                </div>

                {/* Campaigns Table */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Campagnes d'appels de fonds</h2>
                    <GlassCard>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Campagne</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Montant/u</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Échéance</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Cibles</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-40" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                                                <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : campaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                                                Aucune campagne lancée.
                                            </td>
                                        </tr>
                                    ) : (
                                        campaigns.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-white/5 transition-colors group relative cursor-pointer" onClick={() => window.location.href = `/dashboard/finance/${campaign.id}`}>
                                                <td className="px-6 py-4 font-medium text-white">
                                                    <div className="flex items-center gap-2">
                                                        {campaign.name}
                                                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-white/70">{campaign.amount} €</td>
                                                <td className="px-6 py-4 text-white/70">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-white/30" />
                                                        {new Date(campaign.due_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                        <Users size={12} />
                                                        {campaign._count.fees} membres
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Badge variant={new Date(campaign.due_date) < new Date() ? "warning" : "success"}>
                                                            {new Date(campaign.due_date) < new Date() ? "Expiré" : "En cours"}
                                                        </Badge>
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
            </div>

            {/* Launch Campaign Dialog */}
            <Dialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Lancer une campagne d'adhésion"
            >
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Nom de la campagne</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Adhésion 2026"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Montant (€)</label>
                            <input
                                type="number"
                                required
                                placeholder="50"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Date d'échéance</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-white/40 italic">
                        Note: Cette action générera automatiquement un appel de fonds pour TOUS les membres actifs de l'association.
                    </p>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Traitement du batch...
                            </>
                        ) : (
                            "Lancer la campagne"
                        )}
                    </button>
                </form>
            </Dialog>
        </div>
    );
}
