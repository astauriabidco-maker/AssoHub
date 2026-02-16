"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import { apiPost } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await apiPost<AuthResponse>("/auth/login", {
                email,
                password,
            });
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("association", JSON.stringify(data.association));
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur de connexion");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                    <LogIn className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wide">
                    ASSOSHUB
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                    Connectez-vous à votre espace
                </p>
            </div>

            {/* Card */}
            <GlassCard>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-xl font-semibold text-white mb-1">Connexion</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <GlassInput
                        label="Adresse email"
                        type="email"
                        placeholder="votre@email.com"
                        icon={<Mail className="w-4 h-4" />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <GlassInput
                        label="Mot de passe"
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock className="w-4 h-4" />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <GlassButton type="submit" isLoading={isLoading}>
                        Se connecter
                    </GlassButton>
                </form>
            </GlassCard>

            {/* Register Link */}
            <p className="text-center mt-6 text-sm text-gray-400">
                Pas encore de compte ?{" "}
                <Link
                    href="/register"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                    Créer mon association
                </Link>
            </p>
        </div>
    );
}
