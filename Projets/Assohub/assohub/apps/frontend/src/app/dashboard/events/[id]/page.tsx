"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Send,
    FileText,
    Upload,
    Trash2,
    Loader2,
    Calendar,
    MapPin,
    CheckCircle2,
    CloudUpload,
    Download
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EventDocument {
    id: string;
    name: string;
    file_path: string;
    category: string;
    createdAt: string;
}

interface EventDetails {
    id: string;
    title: string;
    description: string;
    location: string;
    start_date: string;
    documents: EventDocument[];
}

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchEvent = async () => {
        try {
            const data = await apiFetch(`/events/${id}`);
            setEvent(data);
        } catch (error) {
            console.error("Failed to fetch event:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleSendConvocations = async () => {
        setInviting(true);
        try {
            const result = await apiFetch(`/events/${id}/convocation`, { method: "POST" });
            alert(result.message);
        } catch (error) {
            console.error("Failed to send convocations:", error);
            alert("Erreur lors de la convocation.");
        } finally {
            setInviting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("category", "AG_REPORT");
        formData.append("eventId", id as string);

        try {
            // Need a raw fetch here because apiFetch might stringify JSON
            const token = localStorage.getItem("assohub_token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/documents/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) throw new Error("Upload failed");
            fetchEvent();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Erreur lors de l'upload.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
    if (!event) return <div className="p-8 text-white">Événement introuvable.</div>;

    const eventDate = new Date(event.start_date);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Nav Back */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold uppercase text-xs tracking-widest">Retour aux événements</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Card */}
                <div className="lg:col-span-2 space-y-8">
                    <GlassCard className="p-8 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="flex flex-col items-center justify-center min-w-[100px] h-[100px] bg-primary/20 rounded-3xl border border-primary/30">
                                <span className="text-primary font-black text-3xl">{eventDate.getDate()}</span>
                                <span className="text-white/40 text-xs font-bold uppercase">{eventDate.toLocaleDateString('fr-FR', { month: 'long' })}</span>
                            </div>
                            <div className="flex-1 space-y-4">
                                <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">{event.title}</h1>
                                <div className="flex flex-wrap gap-6 text-white/60">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={18} className="text-primary" />
                                        <span>{eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin size={18} className="text-primary" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Description</h4>
                            <p className="text-white/70 leading-relaxed text-sm">{event.description || "Aucune description fournie."}</p>
                        </div>
                    </GlassCard>

                    {/* Convocations Simulation */}
                    <GlassCard className="p-8 border-primary/10 bg-primary/5">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Send size={20} className="text-primary" />
                                    Gestion des Convocations
                                </h3>
                                <p className="text-white/40 text-sm">Préparez et envoyez les emails officiels à tous les membres.</p>
                            </div>
                            <button
                                onClick={handleSendConvocations}
                                disabled={inviting}
                                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-black rounded-full shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {inviting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                {inviting ? "Envoi en cours..." : "ENVOYER LES CONVOCATIONS"}
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* GED Section */}
                <div className="space-y-8">
                    <GlassCard className="h-full flex flex-col p-6 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                Documents & PV
                            </h3>
                            <Badge variant="secondary">{event.documents.length}</Badge>
                        </div>

                        {/* Upload Zone */}
                        <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group mb-6">
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            {uploading ? (
                                <Loader2 className="animate-spin text-primary" size={32} />
                            ) : (
                                <>
                                    <CloudUpload size={32} className="text-white/20 group-hover:text-primary group-hover:scale-110 transition-all" />
                                    <p className="text-white/40 text-[10px] font-bold uppercase mt-4 tracking-widest">Glisser ou Cliquer</p>
                                    <p className="text-white/20 text-[9px] mt-1">PDF, DOCX (Max 10MB)</p>
                                </>
                            )}
                        </label>

                        {/* List */}
                        <div className="flex-1 space-y-3 overflow-y-auto">
                            {event.documents.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-xs text-white/20 italic">Aucun document lié.</p>
                                </div>
                            ) : (
                                event.documents.map(doc => (
                                    <div key={doc.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <FileText size={16} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-white truncate" title={doc.name}>{doc.name}</p>
                                                <p className="text-[10px] text-white/30 uppercase">{doc.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${doc.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-white/40 hover:text-primary transition-colors"
                                            >
                                                <Download size={14} />
                                            </a>
                                            <button className="p-2 text-white/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
