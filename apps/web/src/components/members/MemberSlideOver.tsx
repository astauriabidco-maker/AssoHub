"use client";

import { X, Calendar, CreditCard } from "lucide-react";

interface Member {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    status: string;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
    slug: string;
    color: string;
}

const FALLBACK_ROLE_COLORS: Record<string, string> = {
    ADMIN: "#8b5cf6",
    PRESIDENT: "#10b981",
    TREASURER: "#f59e0b",
    SECRETARY: "#06b6d4",
    MEMBER: "#3b82f6",
};

interface MemberSlideOverProps {
    member: Member | null;
    roles?: Role[];
    onClose: () => void;
}

export default function MemberSlideOver({
    member,
    roles = [],
    onClose,
}: MemberSlideOverProps) {
    if (!member) return null;

    const getRoleColor = (slug: string) => {
        const role = roles.find((r) => r.slug === slug);
        return role?.color || FALLBACK_ROLE_COLORS[slug] || "#6b7280";
    };

    const getRoleLabel = (slug: string) => {
        const role = roles.find((r) => r.slug === slug);
        return role?.name || slug;
    };

    const initials =
        (member.firstName?.[0] || "") + (member.lastName?.[0] || member.email[0]);
    const fullName =
        [member.firstName, member.lastName].filter(Boolean).join(" ") ||
        member.email;
    const joinDate = new Date(member.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const roleColor = getRoleColor(member.role);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md backdrop-blur-md bg-slate-900/80 border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">
                        Fiche Membre
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Avatar & Identity */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
                                boxShadow: `0 10px 25px ${roleColor}33`,
                            }}
                        >
                            {initials}
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white">
                                {fullName}
                            </h4>
                            <p className="text-sm text-gray-400 mt-0.5">
                                {member.email}
                            </p>
                        </div>
                        <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                            style={{
                                backgroundColor: `${roleColor}20`,
                                color: roleColor,
                                borderColor: `${roleColor}50`,
                            }}
                        >
                            {getRoleLabel(member.role)}
                        </span>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">
                                    Membre depuis
                                </p>
                                <p className="text-sm font-medium text-white">
                                    {joinDate}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{
                                    backgroundColor:
                                        member.status === "ACTIVE"
                                            ? "rgba(16, 185, 129, 0.2)"
                                            : member.status === "SUSPENDED"
                                                ? "rgba(239, 68, 68, 0.2)"
                                                : "rgba(234, 179, 8, 0.2)",
                                }}
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            member.status === "ACTIVE"
                                                ? "#10b981"
                                                : member.status === "SUSPENDED"
                                                    ? "#ef4444"
                                                    : "#eab308",
                                    }}
                                />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Statut</p>
                                <p className="text-sm font-medium text-white">
                                    {member.status === "ACTIVE"
                                        ? "Actif"
                                        : member.status === "SUSPENDED"
                                            ? "Suspendu"
                                            : member.status}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial History placeholder */}
                    <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <h5 className="text-sm font-medium text-gray-400">
                            Historique Financier
                        </h5>
                        <p className="text-xs text-gray-500 mt-1">
                            Les cotisations et transactions apparaîtront ici
                            (Phase 4).
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
