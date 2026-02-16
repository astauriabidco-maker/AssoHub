"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, Building2, User, Mail, Lock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import { apiPost } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        associationName: "",
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
                    Lancez la gestion de votre association en quelques minutes
                </p>
            </div>

            {/* Card */}
            <GlassCard>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Association */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                1
                            </span>
                            <h2 className="text-base font-semibold text-white">
                                Votre association
                            </h2>
                        </div>
                        <GlassInput
                            label="Nom de l'association"
                            placeholder="Ex: Club Sportif Parisien"
                            icon={<Building2 className="w-4 h-4" />}
                            value={form.associationName}
                            onChange={(e) => updateField("associationName", e.target.value)}
                            required
                        />
                    </div>

                    {/* Section 2: Admin */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                2
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
                                    onChange={(e) => updateField("firstName", e.target.value)}
                                />
                                <GlassInput
                                    label="Nom"
                                    placeholder="Dupont"
                                    icon={<User className="w-4 h-4" />}
                                    value={form.lastName}
                                    onChange={(e) => updateField("lastName", e.target.value)}
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
                    </div>

                    <GlassButton
                        type="submit"
                        isLoading={isLoading}
                        icon={<Rocket className="w-4 h-4" />}
                    >
                        Créer l&apos;association
                    </GlassButton>
                </form>
            </GlassCard>

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
