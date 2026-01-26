"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
    // Form States
    const [associationName, setAssociationName] = useState("");
    const [adminFirstName, setAdminFirstName] = useState("");
    const [adminLastName, setAdminLastName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [adminPassword, setAdminPassword] = useState("");

    // UI States
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = {
                associationName,
                adminFirstName,
                adminLastName,
                adminEmail,
                adminPassword,
                phone
            };

            const data = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            // Auto-login after registration
            localStorage.setItem("assohub_token", data.access_token);
            localStorage.setItem("assohub_user", JSON.stringify(data.user));
            localStorage.setItem("assohub_association", JSON.stringify(data.association));

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
            <div className="w-full max-w-lg space-y-8 glass p-8 rounded-2xl shadow-xl border border-border">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Créer mon Association</h1>
                    <p className="mt-2 text-muted-foreground">Rejoignez Assohub et simplifiez votre gestion</p>
                </div>

                <form onSubmit={handleRegister} className="mt-8 space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Association Info */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Nom de l'association</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                placeholder="Ma Super Asso"
                                value={associationName}
                                onChange={(e) => setAssociationName(e.target.value)}
                            />
                        </div>

                        {/* Admin Identity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Prénom Admin</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                    placeholder="Jean"
                                    value={adminFirstName}
                                    onChange={(e) => setAdminFirstName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Nom Admin</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                    placeholder="Dupont"
                                    value={adminLastName}
                                    onChange={(e) => setAdminLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Email Admin</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                placeholder="admin@asso.com"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Téléphone (Optionnel)</label>
                            <input
                                type="tel"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                placeholder="06 12 34 56 78"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                placeholder="••••••••"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">6 caractères minimum</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-2"
                    >
                        {loading ? "Création en cours..." : "Créer mon association"}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Déjà inscrit ? <a href="/login" className="text-primary font-medium cursor-pointer hover:underline">Se connecter</a>
                </p>
            </div>
        </div>
    );
}
