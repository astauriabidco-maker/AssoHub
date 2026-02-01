"use client";

import React, { useEffect, useState } from "react";
import {
    Users,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Wallet,
    Megaphone,
    Plus,
    X,
    Loader2
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StatsData {
    kpis: {
        totalMembers: number;
        treasury: number;
        upcomingEvents: number;
        variation: string;
    };
    chartData: { name: string; income: number; expense: number }[];
    pieData: { name: string; value: number; color: string }[];
    activities: { id: string; type: string; message: string; date: string }[];
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
    };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", content: "" });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, announcementsData] = await Promise.all([
                    apiFetch("/stats/global"),
                    apiFetch("/communication/announcements").catch(() => [])
                ]);
                setStats(statsData);
                setAnnouncements(announcementsData.slice(0, 3));

                // Check role from token
                const token = localStorage.getItem("token");
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        setIsAdmin(["ADMIN", "PRESIDENT"].includes(payload.role));
                    } catch { }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const newAnnouncement = await apiFetch("/communication/announcements", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            setAnnouncements([newAnnouncement, ...announcements].slice(0, 3));
            setIsModalOpen(false);
            setFormData({ title: "", content: "" });
        } catch (error) {
            console.error("Failed to create announcement:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-white">Erreur de chargement.</div>;

    const cards = [
        {
            title: "Membres Actifs",
            value: stats.kpis.totalMembers,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            variation: "+12%",
            isPositive: true
        },
        {
            title: "Trésorerie",
            value: `${stats.kpis.treasury}€`,
            icon: Wallet,
            color: stats.kpis.treasury >= 0 ? "text-emerald-400" : "text-rose-400",
            bg: stats.kpis.treasury >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10",
            variation: stats.kpis.variation,
            isPositive: stats.kpis.treasury >= 0
        },
        {
            title: "Événements à venir",
            value: stats.kpis.upcomingEvents,
            icon: Calendar,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            variation: "Prochaine AG"
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Announcements Section */}
            <GlassCard className="p-6 border-l-4 border-l-primary">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Megaphone size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">📢 Dernières Annonces</h3>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-sm transition-all"
                        >
                            <Plus size={16} />
                            Publier une annonce
                        </button>
                    )}
                </div>

                {announcements.length === 0 ? (
                    <p className="text-white/40 text-center py-6 italic">Aucune annonce pour le moment.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all"
                            >
                                <h4 className="text-white font-semibold mb-2 line-clamp-1">{announcement.title}</h4>
                                <p className="text-white/60 text-sm line-clamp-3 mb-3">{announcement.content}</p>
                                <div className="flex items-center justify-between text-xs text-white/40">
                                    <span>{announcement.author.firstName} {announcement.author.lastName}</span>
                                    <span>{new Date(announcement.createdAt).toLocaleDateString("fr-FR")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <GlassCard key={i} className="p-6 overflow-hidden relative group hover:border-white/20 transition-all duration-500">
                        <div className="flex justify-between items-start relative z-10">
                            <div className={cn("p-3 rounded-2xl", card.bg, card.color)}>
                                <card.icon size={24} />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                                card.isPositive ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"
                            )}>
                                {card.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {card.variation}
                            </div>
                        </div>
                        <div className="mt-4 relative z-10">
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">{card.title}</p>
                            <h2 className="text-3xl font-black text-white mt-1">{card.value}</h2>
                        </div>
                        {/* Subtle background glow */}
                        <div className={cn("absolute -bottom-8 -right-8 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", card.bg)} />
                    </GlassCard>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Trésorerie */}
                <GlassCard className="lg:col-span-2 p-8 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Analyse Financière</h3>
                            <p className="text-white/40 text-xs mt-1">Flux de revenus et dépenses sur 6 mois</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-[10px] text-white/60">Recettes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="text-[10px] text-white/60">Dépenses</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Répartition Membres */}
                <GlassCard className="p-8 flex flex-col h-[400px]">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white tracking-tight">État des Cotisations</h3>
                        <p className="text-white/40 text-xs mt-1">Répartition globale des paiements</p>
                    </div>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-white">{stats.kpis.totalMembers}</span>
                            <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest">Total</span>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {stats.pieData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-white/60">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Activities Section */}
            <GlassCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Activity size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Activité Récente</h3>
                </div>
                <div className="space-y-6">
                    {stats.activities.length === 0 ? (
                        <p className="text-center text-white/20 italic py-8">Aucune activité récente à afficher.</p>
                    ) : (
                        stats.activities.map((activity, i) => (
                            <div key={activity.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/5 bg-white/5 transition-all group-hover:scale-110 group-hover:border-primary/50",
                                        activity.type === 'EVENT' ? 'text-orange-400' : 'text-emerald-400'
                                    )}>
                                        {activity.type === 'EVENT' ? <Calendar size={18} /> : <TrendingUp size={18} />}
                                    </div>
                                    {i !== stats.activities.length - 1 && <div className="w-px h-full bg-white/5 mt-2" />}
                                </div>
                                <div className="flex-1 pb-6">
                                    <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                                        {activity.message}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-1 uppercase font-bold tracking-widest">
                                        {new Date(activity.date).toLocaleString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>

            {/* Modal Création Annonce */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-6">Publier une annonce</h3>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-white/60 uppercase">Titre</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Rappel Assemblée Générale"
                                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-white/60 uppercase">Contenu</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Écrivez votre message ici..."
                                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={18} className="animate-spin" />}
                                Publier l'annonce
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
