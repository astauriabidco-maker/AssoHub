"use client";

import React, { useEffect, useState } from "react";
import { Plus, Calendar, MapPin, Users, Loader2, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    start_date: string;
    _count: {
        registrations: number;
    };
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        startDate: "",
    });

    const fetchData = async () => {
        try {
            const data = await apiFetch("/events");
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
            };
            await apiFetch("/events", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setIsModalOpen(false);
            setFormData({ title: "", description: "", location: "", startDate: "" });
            fetchData();
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Erreur lors de la création de l'événement.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Événements</h1>
                    <p className="text-white/60 mt-1">Gérez vos assemblées, réunions et sorties</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Créer un événement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <GlassCard key={i} className="p-6 space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-20 w-full" />
                        </GlassCard>
                    ))
                ) : events.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <Calendar size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40 italic">Aucun événement prévu.</p>
                    </div>
                ) : (
                    events.map((event) => {
                        const date = new Date(event.start_date);
                        const isPast = date < new Date();
                        return (
                            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                                <GlassCard className="p-0 group overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer flex flex-col h-full">
                                    <div className="p-6 flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-primary group-hover:border-primary transition-colors duration-500">
                                                <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white/70">
                                                    {date.toLocaleDateString('fr-FR', { month: 'short' })}
                                                </span>
                                                <span className="text-xl font-black text-white leading-none">
                                                    {date.getDate()}
                                                </span>
                                            </div>
                                            <Badge variant={isPast ? "secondary" : "primary"}>
                                                {isPast ? "Passé" : "À venir"}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                                            <p className="text-sm text-white/40 line-clamp-2 mt-1">{event.description || "Aucune description"}</p>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <MapPin size={14} className="text-primary/50" />
                                                <span className="truncate">{event.location || "Lieu non défini"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <Users size={14} className="text-primary/50" />
                                                <span>{event._count.registrations} participants inscrits</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between group-hover:bg-primary/20 transition-colors">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Gérer l'événement</span>
                                        <ArrowRight size={14} className="text-primary transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </GlassCard>
                            </Link>
                        );
                    })
                )}
            </div>

            <Dialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Créer un nouvel événement"
            >
                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Titre de l'événement</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Assemblée Générale 2026"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Lieu</label>
                        <input
                            type="text"
                            placeholder="Ex: Siège social"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Date et heure</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Description</label>
                        <textarea
                            placeholder="Détails de l'événement..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Création...
                            </>
                        ) : (
                            "Planifier l'événement"
                        )}
                    </button>
                </form>
            </Dialog>
        </div>
    );
}
