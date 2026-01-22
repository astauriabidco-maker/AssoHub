"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [association, setAssociation] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("assohub_user");
        const storedAsso = localStorage.getItem("assohub_association");

        if (!storedUser || !storedAsso) {
            router.push("/login");
            return;
        }

        setUser(JSON.parse(storedUser));
        setAssociation(JSON.parse(storedAsso));

        const fetchData = async () => {
            try {
                const usersData = await apiFetch("/users");
                setUsers(usersData);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

    return (
        <div className="min-h-screen bg-background">
            <header className="glass sticky top-0 z-10 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-primary">Assohub</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{user?.email}</span>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                router.push("/login");
                            }}
                            className="text-sm text-destructive hover:underline cursor-pointer"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass p-6 rounded-2xl border border-border shadow-sm">
                        <h2 className="text-muted-foreground text-sm font-medium">Association</h2>
                        <p className="text-2xl font-bold mt-1">{association?.name}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border border-border shadow-sm">
                        <h2 className="text-muted-foreground text-sm font-medium">Membres</h2>
                        <p className="text-2xl font-bold mt-1">{users.length}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border border-border shadow-sm">
                        <h2 className="text-muted-foreground text-sm font-medium">Plan</h2>
                        <p className="text-2xl font-bold mt-1 text-primary">Free</p>
                    </div>
                </div>

                <div className="glass rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <h3 className="font-semibold">Membres récents</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {users.map((u) => (
                            <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div>
                                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                </div>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                    {u.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
