"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    CalendarDays,
    MapPin,
    Clock,
    Users,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Gavel,
    PartyPopper,
    FileText,
    Upload,
    Download,
    ChevronRight,
    Loader2,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost, API_URL, BASE_URL } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

/* ─── Types ─── */
interface EventDetail {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_date: string;
    end_date: string | null;
    type: string;
    createdAt: string;
    registrations: Registration[];
    documents: DocItem[];
}

interface Registration {
    id: string;
    status: string;
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatar_url: string | null;
        role: string;
    };
}

interface DocItem {
    id: string;
    name: string;
    file_url: string;
    category: string;
    createdAt: string;
}

const EVENT_TYPES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    AG: { label: "Assemblée Générale", color: "#8b5cf6", icon: Gavel },
    MEETING: { label: "Réunion", color: "#3b82f6", icon: CalendarDays },
    PARTY: { label: "Fête", color: "#f59e0b", icon: PartyPopper },
};

const DOC_CATEGORIES: Record<string, string> = {
    STATUTES: "Statuts",
    MEETING_MINUTES: "PV de réunion",
    INVOICE: "Facture",
    ADMINISTRATIVE: "Administratif",
    OTHER: "Autre",
};

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [rsvpLoading, setRsvpLoading] = useState(false);

    // Upload state
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState("MEETING_MINUTES");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function loadEvent() {
        try {
            const data = await apiGet<EventDetail>(`/events/${id}`);
            setEvent(data);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadEvent(); }, [id]);

    async function handleRSVP(status: string) {
        setRsvpLoading(true);
        try {
            await apiPost(`/events/${id}/register`, { status });
            await loadEvent();
        } catch { /* silent */ } finally {
            setRsvpLoading(false);
        }
    }

    async function handleUpload() {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;
        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", uploadCategory);
            formData.append("eventId", id);

            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/documents/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            setUploadOpen(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            await loadEvent();
        } catch { /* silent */ } finally {
            setUploadLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <GlassCard className="text-center py-16">
                <p className="text-gray-400">Événement non trouvé.</p>
            </GlassCard>
        );
    }

    const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.MEETING;
    const TypeIcon = typeInfo.icon;
    const attending = event.registrations.filter((r) => r.status === "ATTENDING");
    const absent = event.registrations.filter((r) => r.status === "ABSENT");
    const myReg = event.registrations.find((r) => r.user.id === user?.id);
    const isPast = new Date(event.start_date) < new Date();

    return (
        <RequirePermission permissions={["events.view"]}>
            <div className="space-y-6">
                {/* Back + Header */}
                <button onClick={() => router.push("/dashboard/events")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Retour aux événements
                </button>

                <div className="relative overflow-hidden backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                                    style={{ backgroundColor: `${typeInfo.color}15`, borderColor: `${typeInfo.color}30`, color: typeInfo.color }}
                                >
                                    <TypeIcon className="w-3.5 h-3.5" />
                                    {typeInfo.label}
                                </span>
                                {isPast && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/20">Terminé</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
                            {event.description && <p className="text-gray-400 text-sm mt-2 max-w-2xl">{event.description}</p>}

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4 text-blue-400" />
                                    {formatDateTime(event.start_date)}
                                </span>
                                {event.end_date && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-gray-400" />→ {formatDateTime(event.end_date)}
                                    </span>
                                )}
                                {event.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-amber-400" />
                                        {event.location}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* RSVP buttons */}
                        {!isPast && (
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => handleRSVP("ATTENDING")}
                                    disabled={rsvpLoading}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${myReg?.status === "ATTENDING" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"}`}
                                >
                                    {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Je participe
                                </button>
                                <button
                                    onClick={() => handleRSVP("ABSENT")}
                                    disabled={rsvpLoading}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${myReg?.status === "ABSENT" ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"}`}
                                >
                                    {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Absent
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Decorative accent */}
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: typeInfo.color }} />
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/15 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{attending.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Présents</p>
                    </div>
                    <div className="backdrop-blur-md bg-red-500/10 border border-red-500/15 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">{absent.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Absents</p>
                    </div>
                    <div className="backdrop-blur-md bg-blue-500/10 border border-blue-500/15 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{event.documents.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Documents</p>
                    </div>
                </div>

                {/* ── Participants ── */}
                <GlassCard>
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        Participants ({attending.length})
                    </h3>
                    {attending.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-6">Aucun participant inscrit.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {attending.map((reg) => {
                                const initials = ((reg.user.firstName?.[0] || "") + (reg.user.lastName?.[0] || reg.user.email[0])).toUpperCase();
                                const name = reg.user.firstName && reg.user.lastName
                                    ? `${reg.user.firstName} ${reg.user.lastName}`
                                    : reg.user.email;
                                return (
                                    <div key={reg.id} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                        <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                            {initials}
                                        </div>
                                        <p className="text-xs text-white mt-2 truncate">{name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{reg.user.role}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>

                {/* ── Documents liés ── */}
                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-400" />
                            Documents liés
                        </h3>
                        <GlassButton className="!w-auto px-3 !py-1.5 text-xs" icon={<Upload className="w-3 h-3" />} onClick={() => setUploadOpen(true)}>
                            Ajouter
                        </GlassButton>
                    </div>
                    {event.documents.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-6">Aucun document rattaché.</p>
                    ) : (
                        <div className="space-y-2">
                            {event.documents.map((doc) => (
                                <a
                                    key={doc.id}
                                    href={`${BASE_URL}${doc.file_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{doc.name}</p>
                                        <p className="text-[10px] text-gray-500">{DOC_CATEGORIES[doc.category] || doc.category}</p>
                                    </div>
                                    <Download className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* ── Upload Modal ── */}
                <GlassModal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Ajouter un document">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Catégorie</label>
                            <div className="relative">
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    <option value="MEETING_MINUTES" className="bg-gray-900 text-white">📝 PV de réunion</option>
                                    <option value="STATUTES" className="bg-gray-900 text-white">📜 Statuts</option>
                                    <option value="INVOICE" className="bg-gray-900 text-white">🧾 Facture</option>
                                    <option value="ADMINISTRATIVE" className="bg-gray-900 text-white">📋 Administratif</option>
                                    <option value="OTHER" className="bg-gray-900 text-white">📁 Autre</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Fichier</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 file:cursor-pointer cursor-pointer"
                            />
                        </div>
                        <GlassButton onClick={handleUpload} isLoading={uploadLoading} icon={<Upload className="w-4 h-4" />}>
                            Envoyer
                        </GlassButton>
                    </div>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}
