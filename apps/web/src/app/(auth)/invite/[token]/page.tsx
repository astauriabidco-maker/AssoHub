"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<{ email: string; associationName: string } | null>(null);

    const passwordStrength = (() => {
        if (password.length === 0) return { score: 0, label: "", color: "" };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        const labels = ["", "Faible", "Moyen", "Bon", "Excellent"];
        const colors = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
        return { score, label: labels[score], color: colors[score] };
    })();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/auth/accept-invite`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, password }),
                }
            );
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Erreur lors de l'activation du compte.");
                return;
            }

            setSuccess({ email: data.email, associationName: data.associationName });
        } catch {
            setError("Impossible de joindre le serveur. Réessayez plus tard.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {!success ? (
                    <GlassCard className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-4">
                                <Shield className="w-8 h-8 text-blue-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                Créer votre mot de passe
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Vous avez été invité(e) à rejoindre une association. Définissez votre mot de passe pour activer votre compte.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-300 ml-1">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <GlassInput
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 8 caractères"
                                        icon={<Lock className="w-4 h-4" />}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Strength indicator */}
                                {password.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : "bg-white/10"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Sécurité : <span className="text-gray-200">{passwordStrength.label}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-300 ml-1">
                                    Confirmer le mot de passe
                                </label>
                                <GlassInput
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Retapez votre mot de passe"
                                    icon={<Lock className="w-4 h-4" />}
                                />
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="text-xs text-red-400 ml-1">Les mots de passe ne correspondent pas.</p>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <GlassButton
                                type="submit"
                                isLoading={loading}
                                className="w-full"
                                icon={<ArrowRight className="w-4 h-4" />}
                            >
                                Activer mon compte
                            </GlassButton>
                        </form>
                    </GlassCard>
                ) : (
                    <GlassCard className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Compte activé !
                        </h1>
                        <p className="text-gray-400 mb-6">
                            Votre compte pour <span className="text-white font-medium">{success.associationName}</span> est maintenant actif.
                            Vous pouvez vous connecter avec <span className="text-white font-medium">{success.email}</span>.
                        </p>
                        <Link href="/login">
                            <GlassButton className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
                                Se connecter
                            </GlassButton>
                        </Link>
                    </GlassCard>
                )}
            </div>
        </div>
    );
}
