"use client";

import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    Wallet,
    CalendarDays,
    Network,
    Megaphone,
    Globe,
    ArrowRight,
    CheckCircle,
    User,
    Clock,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// --- Types ---

interface Stats {
    members: number;
    balance: number;
    expected: number;
    events: number;
    children: number;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    scope: string;
    createdAt: string;
    author: { id: string; firstName: string; lastName: string };
    association: { name: string };
}

interface Fee {
    id: string;
    label: string;
    amount: number;
    status: "PAID" | "PENDING" | "OVERDUE";
    dueDate: string;
}

interface Event {
    id: string;
    title: string;
    date: string;
    location?: string;
}

// --- Components ---

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    subtext,
}: {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    color: string;
    subtext?: string;
}) {
    return (
        <GlassCard className="flex items-center gap-4 p-5 h-full relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />

            <div
                className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-lg relative z-10`}
            >
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="relative z-10">
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">{label}</p>
                {subtext && <p className="text-[10px] text-gray-500 mt-1">{subtext}</p>}
            </div>
        </GlassCard>
    );
}

function AnnouncementsList({ announcements }: { announcements: Announcement[] }) {
    return (
        <GlassCard className="h-full">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                Annonces récentes
            </h3>
            {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <Megaphone className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Aucune annonce récente.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.slice(0, 5).map((ann) => (
                        <div
                            key={ann.id}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {ann.association.name}
                                </span>
                                {ann.scope === "NETWORK" && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                                        <Globe className="w-2.5 h-2.5" />
                                        RÉSEAU
                                    </span>
                                )}
                            </div>
                            <h4 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{ann.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                {ann.content}
                            </p>
                            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white">
                                    {ann.author.firstName[0]}
                                </div>
                                <p className="text-[10px] text-gray-500">
                                    {ann.author.firstName} {ann.author.lastName} ·{" "}
                                    {new Date(ann.createdAt).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GlassCard>
    );
}

// --- Member Dashboard View ---

function MemberDashboard({ userId, announcements }: { userId: string; announcements: Announcement[] }) {
    const [stats, setStats] = useState<{ dueAmount: number; nextEvent: Event | null }>({
        dueAmount: 0,
        nextEvent: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch user-specific fees and all events
                const [fees, events] = await Promise.all([
                    apiGet<Fee[]>(`/finance/fees/user/${userId}`).catch(() => [] as Fee[]),
                    apiGet<Event[]>(`/events`).catch(() => [] as Event[]),
                ]);

                // Calculate due amount (PENDING or OVERDUE)
                const due = fees
                    .filter((f) => f.status !== "PAID")
                    .reduce((sum, f) => sum + f.amount, 0);

                // Determine next event
                const now = new Date();
                const upcoming = events
                    .map((e) => ({ ...e, dateObj: new Date(e.date) }))
                    .filter((e) => e.dateObj > now)
                    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

                setStats({
                    dueAmount: due,
                    nextEvent: upcoming[0] || null,
                });
            } catch (err) {
                console.error("Failed to load member stats", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Personal Stats & Activities */}
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Card */}
                    <StatCard
                        label="Mon Statut"
                        value={
                            <span className="flex items-center gap-2 text-emerald-400 text-xl">
                                <CheckCircle className="w-6 h-6" />
                                Membre Actif
                            </span>
                        }
                        icon={User}
                        color="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        subtext="Votre compte est validé"
                    />

                    {/* Fees Card */}
                    <Link href="/dashboard/wallet" className="block h-full group">
                        <GlassCard className="flex items-center gap-4 p-5 h-full relative overflow-hidden hover:border-blue-500/30 transition-colors">
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stats.dueAmount > 0 ? "bg-orange-500" : "bg-emerald-500"} opacity-10 blur-2xl`} />

                            <div className={`w-12 h-12 rounded-xl ${stats.dueAmount > 0 ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"} flex items-center justify-center shrink-0 shadow-lg`}>
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white">
                                    {loading ? "..." : stats.dueAmount === 0 ? "À jour" : `${stats.dueAmount.toLocaleString("fr-FR")} XAF`}
                                </div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">
                                    {loading ? "Chargement..." : stats.dueAmount === 0 ? "Aucune dette" : "Reste à payer"}
                                </p>
                            </div>
                            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                        </GlassCard>
                    </Link>
                </div>

                {/* Next Event Section */}
                <div>
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-400" />
                        Prochain événement
                    </h3>

                    <Link href="/dashboard/events">
                        <GlassCard className="p-0 overflow-hidden hover:border-indigo-500/40 transition-all cursor-pointer group">
                            {/* Event Content */}
                            <div className="p-6 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <CalendarDays className="w-20 h-20 text-indigo-500" />
                                </div>

                                {loading ? (
                                    <div className="py-8 text-center text-gray-500">Chargement...</div>
                                ) : stats.nextEvent ? (
                                    <div className="relative z-10 flex gap-5 items-start">
                                        {/* Date Box */}
                                        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                            <span className="text-xs font-bold uppercase">{new Date(stats.nextEvent.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                                            <span className="text-2xl font-bold">{new Date(stats.nextEvent.date).getDate()}</span>
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                                {stats.nextEvent.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                    {new Date(stats.nextEvent.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                {stats.nextEvent.location && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Globe className="w-4 h-4 text-gray-500" />
                                                        {stats.nextEvent.location}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400 font-medium group-hover:gap-3 transition-all">
                                                Voir les détails <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <p className="text-gray-400 mb-2">Aucun événement à venir.</p>
                                        <div className="inline-flex items-center gap-2 text-indigo-400 text-sm font-medium">
                                            Voir le calendrier complet <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </Link>
                </div>
            </div>

            {/* Right Column: Announcements */}
            <div className="lg:col-span-1">
                <AnnouncementsList announcements={announcements} />
            </div>
        </div>
    );
}

// --- Admin Dashboard View ---

function AdminDashboard({ announcements }: { announcements: Announcement[] }) {
    const [stats, setStats] = useState<Stats>({ members: 0, balance: 0, expected: 0, events: 0, children: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const s = await apiGet<Stats>("/associations/dashboard/stats");
                setStats(s);
            } catch (err) {
                console.error("Failed to load admin stats", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-6">
            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Membres actifs"
                    value={loading ? "..." : stats.members}
                    icon={Users}
                    color="bg-blue-500/20 text-blue-400 border border-blue-500/30"
                />
                <StatCard
                    label="Trésorerie"
                    value={loading ? "..." : `${stats.balance.toLocaleString("fr-FR")} €`}
                    icon={Wallet}
                    color="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                />
                <StatCard
                    label="Événements"
                    value={loading ? "..." : stats.events}
                    icon={CalendarDays}
                    color="bg-purple-500/20 text-purple-400 border border-purple-500/30"
                />
                <StatCard
                    label="Réseau"
                    value={loading ? "..." : stats.children}
                    icon={Network}
                    color="bg-amber-500/20 text-amber-400 border border-amber-500/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area (Network or Charts) */}
                <div className="lg:col-span-2 space-y-6">
                    {stats.children > 0 && (
                        <Link href="/dashboard/network">
                            <GlassCard className="p-6 cursor-pointer hover:bg-white/[0.08] transition-all duration-300 group border-blue-500/10 hover:border-blue-500/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                            <Network className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">
                                                Réseau d'antennes
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                Gérez les {stats.children} antennes et suivez leur activité consolidée.
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                </div>
                            </GlassCard>
                        </Link>
                    )}

                    {/* Quick Actions / Modules Placeholder */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 hidden">
                        <GlassCard className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5">
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-white">Saisir une dépense</span>
                        </GlassCard>
                        <GlassCard className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-white">Ajouter un membre</span>
                        </GlassCard>
                    </div>

                    {/* Placeholder Chart */}
                    <GlassCard className="h-64 flex flex-col items-center justify-center border-dashed border-white/10 bg-white/[0.02]">
                        <Clock className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">Activité récente (Bientôt disponible)</p>
                    </GlassCard>
                </div>

                {/* Announcements Sidebar */}
                <div className="lg:col-span-1">
                    <AnnouncementsList announcements={announcements} />
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---

export default function DashboardOverview() {
    const { user, loading: authLoading } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        // Load announcements for everyone
        apiGet<Announcement[]>("/announcements")
            .then(setAnnouncements)
            .catch(() => setAnnouncements([]));
    }, []);

    if (authLoading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    if (!user) return null;

    const isMember = user.role === "MEMBER";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Bonjour, {user.firstName}
                    </span>
                    <span className="text-3xl animate-pulse">👋</span>
                </h1>
                <p className="text-gray-400 mt-2">
                    {isMember
                        ? "Bienvenue sur votre espace personnel Assoshub."
                        : "Bienvenue sur votre tableau de bord de gestion."}
                </p>
            </div>

            {isMember ? (
                <MemberDashboard userId={user.id} announcements={announcements} />
            ) : (
                <AdminDashboard announcements={announcements} />
            )}
        </div>
    );
}
