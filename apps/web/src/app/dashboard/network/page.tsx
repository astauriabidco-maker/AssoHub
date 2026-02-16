"use client";

import { useEffect, useState, FormEvent } from "react";
import {
    Network,
    Users,
    Wallet,
    CalendarDays,
    Building2,
    Send,
    Megaphone,
    Globe,
    Trash2,
    MapPin,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassModal from "@/components/ui/GlassModal";
import NetworkTree from "@/components/ui/NetworkTree";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

/* ─── Types ─── */
interface ChildStats {
    id: string;
    name: string;
    address_city: string;
    networkLevel: string;
    is_active: boolean;
    members: number;
    finance: { expected: number; collected: number };
    events: number;
}

interface NetworkStats {
    totals: {
        associations: number;
        members: number;
        expected: number;
        collected: number;
        events: number;
    };
    self: {
        members: number;
        finance: { expected: number; collected: number };
        events: number;
    };
    children: ChildStats[];
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

interface Association {
    id: string;
    name: string;
    networkLevel: string;
    parentId?: string;
    children?: { id: string; name: string; networkLevel: string; address_city?: string }[];
}

/* ─── KPI Card ─── */
function KpiCard({
    label,
    value,
    icon: Icon,
    color,
    sub,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    sub?: string;
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
                {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </GlassCard>
    );
}

export default function NetworkPage() {
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [association, setAssociation] = useState<Association | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    // Announcement form
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [annTitle, setAnnTitle] = useState("");
    const [annContent, setAnnContent] = useState("");
    const [annSubmitting, setAnnSubmitting] = useState(false);

    const loadData = async () => {
        try {
            const [statsRes, assocRes, annRes] = await Promise.all([
                apiGet<NetworkStats>("/associations/network/stats"),
                apiGet<Association>("/associations/me"),
                apiGet<Announcement[]>("/announcements"),
            ]);
            setStats(statsRes);
            setAssociation(assocRes);
            setAnnouncements(annRes);
        } catch (err) {
            console.error("Failed to load network data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePostAnnouncement = async (e: FormEvent) => {
        e.preventDefault();
        if (!annTitle.trim() || !annContent.trim()) return;
        setAnnSubmitting(true);
        try {
            await apiPost("/announcements", {
                title: annTitle,
                content: annContent,
                scope: "NETWORK",
            });
            setAnnTitle("");
            setAnnContent("");
            setShowAnnouncementForm(false);
            await loadData();
        } catch (err) {
            console.error("Failed to post announcement:", err);
        } finally {
            setAnnSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        try {
            await apiDelete(`/announcements/${id}`);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full" />
            </div>
        );
    }

    if (!stats || !association) {
        return (
            <GlassCard className="p-8 text-center">
                <Network className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Impossible de charger les données réseau.</p>
            </GlassCard>
        );
    }

    // Build tree data
    const treeRoot = {
        id: association.id,
        name: association.name,
        networkLevel: association.networkLevel,
        members: stats.self.members,
        finance: stats.self.finance,
        events: stats.self.events,
        is_active: true,
        children: stats.children.map((c) => ({
            id: c.id,
            name: c.name,
            address_city: c.address_city,
            networkLevel: c.networkLevel,
            is_active: c.is_active,
            members: c.members,
            finance: c.finance,
            events: c.events,
        })),
    };

    const collectionRate =
        stats.totals.expected > 0
            ? Math.round((stats.totals.collected / stats.totals.expected) * 100)
            : 0;

    return (
        <RequirePermission permissions={["settings.manage"]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Network className="w-6 h-6 text-blue-400" />
                        Vue réseau
                    </h2>
                </div>

                {/* ── KPIs ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Associations"
                        value={stats.totals.associations}
                        icon={Building2}
                        color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                        sub={`${stats.children.length} antenne${stats.children.length > 1 ? "s" : ""}`}
                    />
                    <KpiCard
                        label="Membres totaux"
                        value={stats.totals.members}
                        icon={Users}
                        color="bg-gradient-to-br from-blue-500 to-blue-600"
                        sub={`${stats.self.members} au siège`}
                    />
                    <KpiCard
                        label="Cotisations collectées"
                        value={`${stats.totals.collected.toLocaleString("fr-FR")} €`}
                        icon={Wallet}
                        color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        sub={`${collectionRate}% du total attendu`}
                    />
                    <KpiCard
                        label="Événements total"
                        value={stats.totals.events}
                        icon={CalendarDays}
                        color="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                </div>

                {/* ── Arbre du réseau ── */}
                <GlassCard>
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <Network className="w-4 h-4 text-blue-400" />
                        Arbre hiérarchique
                    </h3>
                    <NetworkTree root={treeRoot} />
                </GlassCard>

                {/* ── Tableau comparatif ── */}
                {stats.children.length > 0 && (
                    <GlassCard>
                        <h3 className="text-base font-semibold text-white mb-4">
                            Comparatif par antenne
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-gray-400 text-xs border-b border-white/10">
                                        <th className="pb-3 font-medium">Antenne</th>
                                        <th className="pb-3 font-medium">Ville</th>
                                        <th className="pb-3 font-medium">Niveau</th>
                                        <th className="pb-3 font-medium text-center">Membres</th>
                                        <th className="pb-3 font-medium text-right">Cotisations</th>
                                        <th className="pb-3 font-medium text-right">Progression</th>
                                        <th className="pb-3 font-medium text-center">Événements</th>
                                        <th className="pb-3 font-medium text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.children.map((child) => {
                                        const rate =
                                            child.finance.expected > 0
                                                ? Math.round(
                                                    (child.finance.collected /
                                                        child.finance.expected) *
                                                    100,
                                                )
                                                : 0;
                                        return (
                                            <tr key={child.id} className="hover:bg-white/[0.03]">
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-300">
                                                            {child.name[0]}
                                                        </div>
                                                        <span className="text-white font-medium">
                                                            {child.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-gray-400 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {child.address_city || "—"}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                                                        {child.networkLevel}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center text-white font-medium">
                                                    {child.members}
                                                </td>
                                                <td className="py-3 text-right text-white">
                                                    {child.finance.collected.toLocaleString("fr-FR")} €
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                                                                style={{ width: `${rate}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400 w-8 text-right">
                                                            {rate}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center text-white">
                                                    {child.events}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${child.is_active
                                                            ? "bg-emerald-500/15 text-emerald-300"
                                                            : "bg-red-500/15 text-red-300"
                                                            }`}
                                                    >
                                                        {child.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                )}

                {/* ── Annonces réseau ── */}
                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-amber-400" />
                            Annonces réseau
                        </h3>
                        {stats.children.length > 0 && (
                            <GlassButton
                                onClick={() => setShowAnnouncementForm(true)}
                                className="text-xs flex items-center gap-1.5"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Diffuser une annonce
                            </GlassButton>
                        )}
                    </div>

                    {announcements.filter((a) => a.scope === "NETWORK").length === 0 ? (
                        <div className="text-center py-8">
                            <Megaphone className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">
                                Aucune annonce réseau pour le moment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {announcements
                                .filter((a) => a.scope === "NETWORK")
                                .map((ann) => (
                                    <div
                                        key={ann.id}
                                        className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                                                    <span className="text-xs font-semibold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full">
                                                        RÉSEAU
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {ann.association.name}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-semibold text-white">
                                                    {ann.title}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-3">
                                                    {ann.content}
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-2">
                                                    Par {ann.author.firstName} {ann.author.lastName} · {" "}
                                                    {new Date(ann.createdAt).toLocaleDateString("fr-FR", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </GlassCard>

                {/* ── Modal : Diffuser une annonce ── */}
                <GlassModal
                    open={showAnnouncementForm}
                    onClose={() => setShowAnnouncementForm(false)}
                    title="Diffuser une annonce au réseau"
                >
                    <form onSubmit={handlePostAnnouncement} className="space-y-4">
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-300 flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" />
                                Cette annonce sera visible par toutes vos antennes.
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-400">Titre</label>
                            <GlassInput
                                value={annTitle}
                                onChange={(e) => setAnnTitle(e.target.value)}
                                placeholder="Titre de l'annonce..."
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-400">Contenu</label>
                            <textarea
                                value={annContent}
                                onChange={(e) => setAnnContent(e.target.value)}
                                placeholder="Rédigez votre annonce..."
                                required
                                rows={4}
                                className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                            />
                        </div>
                        <GlassButton
                            type="submit"
                            disabled={annSubmitting}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {annSubmitting ? "Envoi..." : "Diffuser au réseau"}
                        </GlassButton>
                    </form>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}
