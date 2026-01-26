"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Wallet,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Hexagon,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Membres", icon: Users, href: "/dashboard/members" },
    { label: "Finance", icon: Wallet, href: "/dashboard/finance" },
    { label: "Événements", icon: Calendar, href: "/dashboard/events" },
    { label: "Documents", icon: FileText, href: "/dashboard/documents" },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem("assohub_user");
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950/40 backdrop-blur-xl border-r border-white/10 flex flex-col z-50">
            {/* Logo Section */}
            <div className="p-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                    <Hexagon className="text-primary animate-pulse-slow" size={24} />
                </div>
                <span className="text-xl font-black text-white tracking-tighter uppercase">Assohub</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Menu Principal</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                isActive
                                    ? "bg-primary/20 text-white shadow-lg shadow-primary/10 border border-primary/20"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-transform group-hover:scale-110 duration-300",
                                isActive ? "text-primary" : "text-white/20"
                            )} />
                            <span className="font-semibold">{item.label}</span>
                            {isActive && (
                                <div className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            )}
                        </Link>
                    );
                })}

                {/* Super Admin Section */}
                {user?.role === "SUPER_ADMIN" && (
                    <div className="pt-4 space-y-2">
                        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Plateforme</p>
                        <Link
                            href="/dashboard/super-admin"
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                pathname === "/dashboard/super-admin"
                                    ? "bg-primary/20 text-white shadow-lg shadow-primary/10 border border-primary/20"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <ShieldCheck size={20} className={cn(
                                "transition-transform group-hover:scale-110 duration-300",
                                pathname === "/dashboard/super-admin" ? "text-primary" : "text-white/20"
                            )} />
                            <span className="font-semibold text-primary/80">Admin Plateforme</span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-6 border-t border-white/5 space-y-4">
                <button
                    onClick={() => { }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all group"
                >
                    <Settings size={20} className="text-white/20 group-hover:rotate-45 transition-transform duration-500" />
                    <span className="font-semibold">Paramètres</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-all group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
