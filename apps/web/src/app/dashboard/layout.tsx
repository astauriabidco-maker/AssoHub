"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    FolderOpen,
    Wallet,
    CalendarDays,
    Settings,
    LogOut,
    ChevronRight,
    UserCircle,
    ShieldAlert,
    Shield,
    Network,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string; // permission key required to see this item
}

const allNavItems: NavItem[] = [
    { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, permission: "dashboard.view" },
    { href: "/dashboard/members", label: "Membres", icon: Users, permission: "members.view" },
    { href: "/dashboard/groups", label: "Groupes", icon: FolderOpen, permission: "groups.view" },
    { href: "/dashboard/finance", label: "Finances", icon: Wallet, permission: "finance.view" },
    { href: "/dashboard/events", label: "Événements", icon: CalendarDays, permission: "events.view" },
    { href: "/dashboard/network", label: "Réseau", icon: Network, permission: "settings.manage" },
    { href: "/dashboard/profile", label: "Mon Espace", icon: UserCircle },
    { href: "/dashboard/settings", label: "Paramètres", icon: Settings, permission: "settings.manage" },
    { href: "/dashboard/settings/roles", label: "Rôles", icon: Shield, permission: "roles.manage" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout, hasPermission } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [toast, setToast] = useState("");
    const [associationName, setAssociationName] = useState("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem("association");
            if (raw) {
                const a = JSON.parse(raw);
                setAssociationName(a.name || "");
            }
        } catch { /* ignored */ }
    }, []);

    // Show unauthorized toast
    useEffect(() => {
        if (searchParams.get("error") === "unauthorized") {
            setToast("Accès non autorisé — vous n'avez pas les droits nécessaires.");
            const t = setTimeout(() => setToast(""), 4000);
            window.history.replaceState({}, "", "/dashboard");
            return () => clearTimeout(t);
        }
    }, [searchParams]);

    if (loading || !user) return null;

    const visibleNavItems = allNavItems.filter(
        (item) => !item.permission || hasPermission(item.permission)
    );

    const initials =
        (user.firstName?.[0] || "") + (user.lastName?.[0] || user.email[0] || "");

    const currentPageLabel =
        visibleNavItems.find(
            (i) =>
                pathname === i.href ||
                (i.href !== "/dashboard" && pathname.startsWith(i.href))
        )?.label || "Dashboard";

    return (
        <div className="relative min-h-screen flex z-10">
            {/* ── Toast ── */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 text-sm px-5 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top duration-300">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {toast}
                </div>
            )}

            {/* ── Sidebar ── */}
            <aside className="w-64 shrink-0 backdrop-blur-md bg-white/[0.06] border-r border-white/10 flex flex-col">
                {/* Brand */}
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white truncate">
                        {associationName}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">ASSOSHUB</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {visibleNavItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        const isSubItem = item.href.split("/").length > 3; // e.g. /dashboard/settings/roles

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${isSubItem ? "ml-4 text-xs" : ""}
                  ${isActive
                                        ? "bg-white/10 text-white shadow-sm shadow-blue-500/10"
                                        : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                                    }
                `}
                            >
                                <item.icon
                                    className={`w-[18px] h-[18px] ${isActive
                                        ? "text-blue-400"
                                        : "text-gray-500 group-hover:text-gray-300"
                                        } ${isSubItem ? "w-[14px] h-[14px]" : ""}`}
                                />
                                <span className="flex-1">{item.label}</span>
                                {isActive && (
                                    <ChevronRight className="w-3.5 h-3.5 text-blue-400/60" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="h-16 shrink-0 backdrop-blur-md bg-white/[0.04] border-b border-white/10 flex items-center justify-between px-6">
                    <div>
                        <h1 className="text-base font-semibold text-white">
                            {currentPageLabel}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400 hidden sm:block">
                            {user.firstName} {user.lastName}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold uppercase">
                            {initials}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
