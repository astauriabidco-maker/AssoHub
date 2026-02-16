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
} from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { apiGet } from "@/lib/api";

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

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <GlassCard className="flex items-center gap-4 p-5">
            <div
                className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}
            >
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
        </GlassCard>
    );
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<Stats>({ members: 0, balance: 0, expected: 0, events: 0, children: 0 });
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, ann] = await Promise.all([
                    apiGet<Stats>("/associations/dashboard/stats"),
                    apiGet<Announcement[]>("/announcements").catch(() => [] as Announcement[]),
                ]);
                setStats(s);
                setAnnouncements(ann);
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Tableau de bord</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Membres actifs"
                    value={loading ? "..." : stats.members}
                    icon={Users}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                    label="Cotisations collectées"
                    value={loading ? "..." : `${stats.balance.toLocaleString("fr-FR")} €`}
                    icon={Wallet}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                    label="Événements"
                    value={loading ? "..." : stats.events}
                    icon={CalendarDays}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                    label="Modules"
                    value="6"
                    icon={LayoutDashboard}
                    color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
            </div>

            {/* ── Network Summary (if has children) ── */}
            {stats.children > 0 && (
                <Link href="/dashboard/network">
                    <GlassCard className="p-5 cursor-pointer hover:bg-white/[0.08] transition-all duration-200 group border-blue-500/10 hover:border-blue-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                                    <Network className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Réseau — {stats.children} antenne{stats.children > 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Voir le tableau de bord consolidé du réseau
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </GlassCard>
                </Link>
            )}

            {/* ── Recent Announcements ── */}
            <GlassCard>
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    Annonces récentes
                </h3>
                {announcements.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        Aucune annonce. Les annonces réseau de votre fédération apparaîtront ici.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {announcements.slice(0, 5).map((ann) => (
                            <div
                                key={ann.id}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {ann.scope === "NETWORK" && (
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded-full">
                                            <Globe className="w-2.5 h-2.5" />
                                            RÉSEAU
                                        </span>
                                    )}
                                    <span className="text-[10px] text-gray-500">
                                        {ann.association.name}
                                    </span>
                                </div>
                                <h4 className="text-sm font-medium text-white">{ann.title}</h4>
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                                    {ann.content}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1.5">
                                    Par {ann.author.firstName} {ann.author.lastName} ·{" "}
                                    {new Date(ann.createdAt).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
