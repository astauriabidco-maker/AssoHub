"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, Building2, User, Mail, Lock, MapPin, Landmark, ChevronRight, ChevronLeft } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import { apiPost } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

const ASSOCIATION_TYPES = [
    { value: "FAMILY", label: "Familiale", icon: "🏠", description: "Famille, tribu, canton" },
    { value: "CULTURAL", label: "Culturelle", icon: "🎭", description: "Art, culture, patrimoine" },
    { value: "SPORTS", label: "Sportive", icon: "⚽", description: "Club sportif, ligue" },
    { value: "POLITICAL", label: "Politique", icon: "🏛️", description: "Parti, mouvement citoyen" },
    { value: "RELIGIOUS", label: "Religieuse", icon: "🕊️", description: "Église, mosquée, temple" },
    { value: "OTHER", label: "Autre", icon: "🌐", description: "ONG, humanitaire, pro" },
];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1 = type selection, 2 = association details, 3 = admin account
    const [form, setForm] = useState({
        associationName: "",
        associationType: "",
        originVillage: "",
        originRegion: "",
        chieftaincy: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function selectType(type: string) {
        updateField("associationType", type);
        setStep(2);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await apiPost<AuthResponse>("/auth/register", form);
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("association", JSON.stringify(data.association));
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur d'inscription");
        } finally {
            setIsLoading(false);
        }
    }

    const selectedType = ASSOCIATION_TYPES.find((t) => t.value === form.associationType);

    return (
        <div className="w-full max-w-lg">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                    <Rocket className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wide">
                    Créer votre espace
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                    {step === 1
                        ? "Quel type d'association souhaitez-vous gérer ?"
                        : step === 2
                            ? "Informations sur votre association"
                            : "Créez votre compte administrateur"}
                </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`h-1.5 rounded-full transition-all duration-300 ${s === step
                            ? "w-8 bg-blue-500"
                            : s < step
                                ? "w-6 bg-blue-500/40"
                                : "w-6 bg-white/10"
                            }`}
                    />
                ))}
            </div>

            {/* ─── Step 1: Type Selection ─── */}
            {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                    {ASSOCIATION_TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => selectType(type.value)}
                            className={`group relative p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer hover:scale-[1.02] ${form.associationType === type.value
                                ? "bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10"
                                : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                                }`}
                        >
                            <span className="text-3xl block mb-2">{type.icon}</span>
                            <h3 className="text-sm font-semibold text-white">{type.label}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* ─── Step 2: Association Details ─── */}
            {step === 2 && (
                <GlassCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setStep(3);
                        }}
                        className="space-y-5"
                    >
                        {/* Selected type badge */}
                        {selectedType && (
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                                <span className="text-lg">{selectedType.icon}</span>
                                <span className="text-sm text-blue-300 font-medium">
                                    {selectedType.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                >
                                    Changer
                                </button>
                            </div>
                        )}

                        <GlassInput
                            label="Nom de l'association"
                            placeholder={
                                form.associationType === "FAMILY"
                                    ? "Ex: Association Famille Tchatchoua"
                                    : form.associationType === "SPORTS"
                                        ? "Ex: Club Sportif Mbouda"
                                        : "Ex: Mon Association"
                            }
                            icon={<Building2 className="w-4 h-4" />}
                            value={form.associationName}
                            onChange={(e) => updateField("associationName", e.target.value)}
                            required
                        />

                        {/* Conditional fields for FAMILY type */}
                        {form.associationType === "FAMILY" && (
                            <div className="space-y-4 pt-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-medium text-gray-300">
                                        Origine
                                    </span>
                                </div>
                                <GlassInput
                                    label="Village d'origine"
                                    placeholder="Ex: Bandjoun, Bafang, Dschang…"
                                    icon={<MapPin className="w-4 h-4" />}
                                    value={form.originVillage}
                                    onChange={(e) =>
                                        updateField("originVillage", e.target.value)
                                    }
                                />
                                <GlassInput
                                    label="Région / Département"
                                    placeholder="Ex: Ouest, Menoua, Koung-Khi…"
                                    icon={<MapPin className="w-4 h-4" />}
                                    value={form.originRegion}
                                    onChange={(e) =>
                                        updateField("originRegion", e.target.value)
                                    }
                                />
                                <GlassInput
                                    label="Chefferie d'appartenance"
                                    placeholder="Ex: Chefferie Bandjoun"
                                    icon={<Landmark className="w-4 h-4" />}
                                    value={form.chieftaincy}
                                    onChange={(e) =>
                                        updateField("chieftaincy", e.target.value)
                                    }
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Retour
                            </button>
                            <GlassButton
                                type="submit"
                                icon={<ChevronRight className="w-4 h-4" />}
                            >
                                Continuer
                            </GlassButton>
                        </div>
                    </form>
                </GlassCard>
            )}

            {/* ─── Step 3: Admin Account ─── */}
            {step === 3 && (
                <GlassCard>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                                {error}
                            </div>
                        )}

                        {/* Recap badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {selectedType && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                                    {selectedType.icon} {selectedType.label}
                                </span>
                            )}
                            {form.associationName && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 truncate max-w-[200px]">
                                    <Building2 className="w-3 h-3 shrink-0" />
                                    {form.associationName}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                                Modifier
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                <User className="w-3.5 h-3.5" />
                            </span>
                            <h2 className="text-base font-semibold text-white">
                                Compte administrateur
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <GlassInput
                                    label="Prénom"
                                    placeholder="Jean"
                                    icon={<User className="w-4 h-4" />}
                                    value={form.firstName}
                                    onChange={(e) =>
                                        updateField("firstName", e.target.value)
                                    }
                                />
                                <GlassInput
                                    label="Nom"
                                    placeholder="Dupont"
                                    icon={<User className="w-4 h-4" />}
                                    value={form.lastName}
                                    onChange={(e) =>
                                        updateField("lastName", e.target.value)
                                    }
                                />
                            </div>
                            <GlassInput
                                label="Email"
                                type="email"
                                placeholder="admin@asso.com"
                                icon={<Mail className="w-4 h-4" />}
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                required
                            />
                            <GlassInput
                                label="Mot de passe"
                                type="password"
                                placeholder="Minimum 6 caractères"
                                icon={<Lock className="w-4 h-4" />}
                                value={form.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Retour
                            </button>
                            <GlassButton
                                type="submit"
                                isLoading={isLoading}
                                icon={<Rocket className="w-4 h-4" />}
                            >
                                Créer l&apos;association
                            </GlassButton>
                        </div>
                    </form>
                </GlassCard>
            )}

            {/* Login Link */}
            <p className="text-center mt-6 text-sm text-gray-400">
                Déjà un compte ?{" "}
                <Link
                    href="/login"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                    Se connecter
                </Link>
            </p>
        </div>
    );
}
