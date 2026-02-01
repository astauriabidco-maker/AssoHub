"use client";

import React, { useEffect, useState, use } from "react";
import {
    Calendar, MapPin, Mail, Phone, Users, Loader2, X, Check, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssociationData {
    id: string;
    name: string;
    slug: string;
    slogan: string | null;
    description: string | null;
    logo_url: string | null;
    address_street: string | null;
    address_city: string | null;
    address_zip: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    events: {
        id: string;
        title: string;
        date: string;
        location: string | null;
    }[];
}

export default function PublicAssociationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [association, setAssociation] = useState<AssociationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        const fetchAssociation = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const response = await fetch(`${apiBase}/public/associations/${slug}`);
                if (!response.ok) throw new Error("Association non trouvée");
                const data = await response.json();
                setAssociation(data);
            } catch {
                setError("Cette association n'existe pas ou n'est pas accessible.");
            } finally {
                setLoading(false);
            }
        };
        fetchAssociation();
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${apiBase}/public/associations/${slug}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("Erreur lors de la soumission");
            setSuccess(true);
        } catch {
            alert("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-white/50" />
            </div>
        );
    }

    if (error || !association) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-white/60">{error || "Association non trouvée"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
            {/* Header */}
            <header className="bg-black/20 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    {association.logo_url ? (
                        <img src={association.logo_url} alt={association.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                            {association.name.charAt(0)}
                        </div>
                    )}
                    <span className="text-white font-semibold text-lg">{association.name}</span>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-24 px-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        {association.name}
                    </h1>
                    {association.slogan && (
                        <p className="text-xl md:text-2xl text-white/70 mb-8">
                            {association.slogan}
                        </p>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-full shadow-xl shadow-primary/30 transition-all hover:scale-105"
                    >
                        <Users size={24} />
                        Nous rejoindre
                        <ChevronRight size={20} />
                    </button>
                </div>
            </section>

            {/* About Section */}
            {association.description && (
                <section className="py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">Qui sommes-nous ?</h2>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                            <p className="text-white/80 text-lg leading-relaxed whitespace-pre-line">
                                {association.description}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Events Section */}
            {association.events.length > 0 && (
                <section className="py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">Nos prochains événements</h2>
                        <div className="grid gap-4">
                            {association.events.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center gap-6"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex flex-col items-center justify-center text-primary">
                                        <span className="text-2xl font-bold">{new Date(event.date).getDate()}</span>
                                        <span className="text-xs uppercase">{new Date(event.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold text-lg">{event.title}</h3>
                                        {event.location && (
                                            <p className="text-white/50 flex items-center gap-1 text-sm mt-1">
                                                <MapPin size={14} />
                                                {event.location}
                                            </p>
                                        )}
                                    </div>
                                    <Calendar className="text-white/30" size={24} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact Section */}
            {(association.contact_email || association.contact_phone || association.address_city) && (
                <section className="py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">Nous contacter</h2>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 grid md:grid-cols-2 gap-6">
                            {association.contact_email && (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white/50 text-sm">Email</p>
                                        <p className="text-white font-medium">{association.contact_email}</p>
                                    </div>
                                </div>
                            )}
                            {association.contact_phone && (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white/50 text-sm">Téléphone</p>
                                        <p className="text-white font-medium">{association.contact_phone}</p>
                                    </div>
                                </div>
                            )}
                            {association.address_city && (
                                <div className="flex items-center gap-4 md:col-span-2">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white/50 text-sm">Adresse</p>
                                        <p className="text-white font-medium">
                                            {[association.address_street, association.address_zip, association.address_city].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Footer */}
            <section className="py-16 px-6 bg-gradient-to-r from-primary/30 to-purple-500/30">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Prêt à nous rejoindre ?</h2>
                    <p className="text-white/60 mb-8">Rejoignez notre communauté et participez à nos activités.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-full shadow-xl transition-all hover:scale-105"
                    >
                        <Users size={24} />
                        Demander mon adhésion
                    </button>
                </div>
            </section>

            {/* Join Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !success && setIsModalOpen(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center mb-6">
                                    <Check size={32} className="text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Demande envoyée !</h3>
                                <p className="text-white/60">
                                    Votre demande a été transmise au bureau de l'association. Vous serez contacté prochainement.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-white mb-6">Demande d'adhésion</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-white/60 uppercase">Prénom</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-white/60 uppercase">Nom</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-white/60 uppercase">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-white/60 uppercase">Téléphone (optionnel)</label>
                                        <input
                                            type="tel"
                                            className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2"
                                    >
                                        {submitting && <Loader2 size={18} className="animate-spin" />}
                                        Envoyer ma demande
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
