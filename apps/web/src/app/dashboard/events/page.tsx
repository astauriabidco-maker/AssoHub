"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    Plus,
    MapPin,
    Clock,
    Users,
    ChevronRight,
    FileText,
    Gavel,
    PartyPopper,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost } from "@/lib/api";

/* ─── Types ─── */
interface EventItem {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_date: string;
    end_date: string | null;
    type: string;
    attending: number;
    absent: number;
    totalRegistrations: number;
    documentsCount: number;
    createdAt: string;
}

const EVENT_TYPES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    AG: { label: "Assemblée Générale", color: "#8b5cf6", icon: Gavel },
    MEETING: { label: "Réunion", color: "#3b82f6", icon: CalendarDays },
    PARTY: { label: "Fête", color: "#f59e0b", icon: PartyPopper },
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

function formatDateShort(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function EventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        start_date: "",
        start_time: "18:00",
        end_date: "",
        end_time: "20:00",
        type: "MEETING",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    async function loadEvents() {
        try {
            const data = await apiGet<EventItem[]>("/events");
            setEvents(data);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEvents();
    }, []);

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);
        try {
            const start = `${form.start_date}T${form.start_time}:00`;
            const end = form.end_date ? `${form.end_date}T${form.end_time}:00` : form.start_date ? `${form.start_date}T${form.end_time}:00` : undefined;
            await apiPost("/events", {
                title: form.title,
                description: form.description || undefined,
                location: form.location || undefined,
                start_date: start,
                end_date: end,
                type: form.type,
            });
            setModalOpen(false);
            setForm({ title: "", description: "", location: "", start_date: "", start_time: "18:00", end_date: "", end_time: "20:00", type: "MEETING" });
            await loadEvents();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Erreur lors de la création.");
        } finally {
            setFormLoading(false);
        }
    }

    // Split into upcoming and past
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.start_date) >= now);
    const past = events.filter((e) => new Date(e.start_date) < now);

    return (
        <RequirePermission permissions={["events.view"]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-400" />
                        Événements
                    </h2>
                    <GlassButton className="!w-auto px-5" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
                        Créer un événement
                    </GlassButton>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <GlassCard className="text-center py-16">
                        <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-40" />
                        <p className="text-gray-400 text-sm">Aucun événement planifié.</p>
                        <p className="text-gray-500 text-xs mt-1">
                            Cliquez sur &quot;Créer un événement&quot; pour commencer.
                        </p>
                    </GlassCard>
                ) : (
                    <>
                        {/* Upcoming */}
                        {upcoming.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    À venir ({upcoming.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {upcoming.map((evt) => (
                                        <EventCard key={evt.id} event={evt} onClick={() => router.push(`/dashboard/events/${evt.id}`)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past */}
                        {past.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    Passés ({past.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {past.map((evt) => (
                                        <EventCard key={evt.id} event={evt} isPast onClick={() => router.push(`/dashboard/events/${evt.id}`)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── Create Modal ── */}
                <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} title="Créer un événement">
                    <form onSubmit={handleCreate} className="space-y-4">
                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{formError}</div>
                        )}

                        <GlassInput label="Titre" placeholder="Assemblée Générale 2026" icon={<CalendarDays className="w-4 h-4" />} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />

                        {/* Type select */}
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Type</label>
                            <div className="relative">
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    <option value="MEETING" className="bg-gray-900 text-white">📋 Réunion</option>
                                    <option value="AG" className="bg-gray-900 text-white">⚖️ Assemblée Générale</option>
                                    <option value="PARTY" className="bg-gray-900 text-white">🎉 Fête / Événement</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>

                        <GlassInput label="Lieu" placeholder="Salle des fêtes" icon={<MapPin className="w-4 h-4" />} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />

                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput label="Date de début" type="date" icon={<CalendarDays className="w-4 h-4" />} value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required />
                            <GlassInput label="Heure" type="time" icon={<Clock className="w-4 h-4" />} value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <GlassInput label="Date de fin (optionnel)" type="date" icon={<CalendarDays className="w-4 h-4" />} value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                            <GlassInput label="Heure de fin" type="time" icon={<Clock className="w-4 h-4" />} value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
                        </div>

                        <GlassInput label="Description" placeholder="Ordre du jour, informations..." icon={<FileText className="w-4 h-4" />} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

                        <div className="pt-2">
                            <GlassButton type="submit" isLoading={formLoading} icon={<Plus className="w-4 h-4" />}>Créer l&apos;événement</GlassButton>
                        </div>
                    </form>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}

/* ─── Event Card ─── */
function EventCard({ event, isPast, onClick }: { event: EventItem; isPast?: boolean; onClick: () => void }) {
    const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.MEETING;
    const TypeIcon = typeInfo.icon;
    const d = new Date(event.start_date);
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();

    return (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:bg-white/[0.07] hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/5 ${isPast ? "opacity-60" : ""}`}
        >
            <div className="flex gap-4">
                {/* Date badge */}
                <div className="shrink-0 w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white leading-none">{dayNum}</span>
                    <span className="text-[10px] font-medium text-gray-400 uppercase">{monthShort}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                            style={{ backgroundColor: `${typeInfo.color}15`, borderColor: `${typeInfo.color}30`, color: typeInfo.color }}
                        >
                            <TypeIcon className="w-3 h-3" />
                            {typeInfo.label}
                        </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm truncate">{event.title}</h3>
                    {event.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.attending} participant{event.attending > 1 ? "s" : ""}
                        </span>
                        {event.documentsCount > 0 && (
                            <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {event.documentsCount}
                            </span>
                        )}
                    </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors self-center" />
            </div>

            {/* Bottom gradient accent */}
            <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${typeInfo.color}, transparent)` }}
            />
        </div>
    );
}
