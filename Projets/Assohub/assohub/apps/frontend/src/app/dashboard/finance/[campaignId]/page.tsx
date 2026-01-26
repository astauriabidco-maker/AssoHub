"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Check, Clock, Calendar, Users, TrendingUp, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Fee {
    id: string;
    amount: number;
    status: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    updatedAt: string;
}

interface CampaignDetails {
    id: string;
    name: string;
    amount: number;
    due_date: string;
    createdAt: string;
    fees: Fee[];
}

export default function CampaignDetailsPage() {
    const { campaignId } = useParams();
    const router = useRouter();
    const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [validatingId, setValidatingId] = useState<string | null>(null);

    const fetchDetails = async () => {
        try {
            const data = await apiFetch(`/finance/campaigns/${campaignId}`);
            setCampaign(data);
        } catch (error) {
            console.error("Failed to fetch campaign details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [campaignId]);

    const stats = useMemo(() => {
        if (!campaign) return { total: 0, received: 0, progress: 0, count: 0, paidCount: 0 };
        const total = campaign.fees.length * campaign.amount;
        const received = campaign.fees.filter(f => f.status === 'PAID').length * campaign.amount;
        const progress = total > 0 ? (received / total) * 100 : 0;
        return {
            total,
            received,
            progress,
            count: campaign.fees.length,
            paidCount: campaign.fees.filter(f => f.status === 'PAID').length
        };
    }, [campaign]);

    const handleValidatePayment = async (feeId: string) => {
        setValidatingId(feeId);
        try {
            await apiFetch(`/finance/fees/${feeId}/pay`, { method: "PATCH" });
            // Optimistic update
            if (campaign) {
                setCampaign({
                    ...campaign,
                    fees: campaign.fees.map(f => f.id === feeId ? { ...f, status: 'PAID' } : f)
                });
            }
        } catch (error) {
            console.error("Failed to validate payment:", error);
            alert("Erreur lors de la validation du paiement.");
        } finally {
            setValidatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8 bg-abstract-gradient space-y-8">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full rounded-3xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen p-8 bg-abstract-gradient flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl font-bold">Campagne non trouvée</h2>
                <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">Retour</button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Navigation Header */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="font-medium">Retour aux finances</span>
                </button>

                {/* Hero Highlights Card */}
                <GlassCard className="p-8 relative overflow-hidden">
                    <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <Badge variant="primary" className="px-3 py-1">Campagne Active</Badge>
                            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {campaign.name}
                            </h1>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Calendar size={18} className="text-primary" />
                                    <span>Échéance : <b>{new Date(campaign.due_date).toLocaleDateString()}</b></span>
                                </div>
                                <div className="flex items-center gap-2 text-white/60">
                                    <Users size={18} className="text-primary" />
                                    <span>Cibles : <b>{stats.count} membres</b></span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/40 text-xs uppercase font-bold tracking-widest mb-1">Total Collecté</p>
                                    <h2 className="text-3xl font-black text-white">{stats.received} € <span className="text-white/20 text-lg">/ {stats.total} €</span></h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-primary font-bold text-2xl">{Math.round(stats.progress)}%</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${stats.progress}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-xs text-white/40">
                                <span>{stats.paidCount} payés</span>
                                <span>{stats.count - stats.paidCount} en attente</span>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                </GlassCard>

                {/* Table: Tracking */}
                <GlassCard className="overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" />
                            Suivi des encaissements
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Membre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Montant</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Statut</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {campaign.fees.map((fee) => (
                                    <tr key={fee.id} className={cn(
                                        "transition-colors group",
                                        fee.status === 'PAID' ? "bg-emerald-500/5" : "hover:bg-white/5"
                                    )}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                    {fee.user.firstName ? `${fee.user.firstName[0]}${fee.user.lastName[0]}`.toUpperCase() : fee.user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{fee.user.firstName} {fee.user.lastName}</p>
                                                    <p className="text-xs text-white/30">{fee.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-white">
                                            {campaign.amount} €
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={fee.status === 'PAID' ? 'success' : 'warning'} className="min-w-[100px] justify-center">
                                                {fee.status === 'PAID' ? (
                                                    <span className="flex items-center gap-1"><Check size={12} /> Payé</span>
                                                ) : (
                                                    <span className="flex items-center gap-1"><Clock size={12} /> En attente</span>
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {fee.status === 'PENDING' ? (
                                                <button
                                                    onClick={() => handleValidatePayment(fee.id)}
                                                    disabled={validatingId === fee.id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {validatingId === fee.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Check size={14} />
                                                    )}
                                                    Valider
                                                </button>
                                            ) : (
                                                <div className="text-emerald-500 flex items-center justify-end gap-1 text-xs font-bold">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
