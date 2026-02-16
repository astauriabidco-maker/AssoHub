"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    Target,
    TrendingUp,
    Wallet,
    Building2,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface FeeUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    status: string;
    association?: { id: string; name: string };
}

interface FeeTargetAssociation {
    id: string;
    name: string;
    address_city: string | null;
    networkLevel: string;
}

interface Fee {
    id: string;
    status: string;
    userId: string | null;
    user: FeeUser | null;
    targetAssociationId: string | null;
    targetAssociation: FeeTargetAssociation | null;
    createdAt: string;
    updatedAt: string;
}

interface CampaignDetail {
    id: string;
    name: string;
    description: string | null;
    amount: number;
    due_date: string;
    scope: string;
    createdAt: string;
    totalMembers: number;
    paidMembers: number;
    totalExpected: number;
    totalCollected: number;
    progress: number;
    fees: Fee[];
}

const SCOPE_LABELS: Record<string, { label: string; color: string }> = {
    LOCAL: { label: "Local", color: "#6366f1" },
    NETWORK_MEMBERS: { label: "Réseau (Membres)", color: "#3b82f6" },
    NETWORK_BRANCHES: { label: "Réseau (Antennes)", color: "#8b5cf6" },
};

function formatCurrency(n: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        minimumFractionDigits: 0,
    }).format(n);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function CampaignDetailPage() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const router = useRouter();
    const { hasPermission } = useAuth();
    const canEdit = hasPermission("finance.edit");

    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [payingIds, setPayingIds] = useState<Set<string>>(new Set());

    const loadCampaign = useCallback(async () => {
        try {
            const data = await apiGet<CampaignDetail>(
                `/finance/campaigns/${campaignId}`
            );
            setCampaign(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        loadCampaign();
    }, [loadCampaign]);

    async function handlePay(feeId: string) {
        if (payingIds.has(feeId)) return;

        // Optimistic update
        setPayingIds((prev) => new Set(prev).add(feeId));
        setCampaign((prev) => {
            if (!prev) return prev;
            const updatedFees = prev.fees.map((f) =>
                f.id === feeId ? { ...f, status: "PAID" } : f
            );
            const paidCount = updatedFees.filter(
                (f) => f.status === "PAID"
            ).length;
            return {
                ...prev,
                fees: updatedFees,
                paidMembers: paidCount,
                totalCollected: paidCount * prev.amount,
                progress:
                    updatedFees.length > 0
                        ? Math.round((paidCount / updatedFees.length) * 100)
                        : 0,
            };
        });

        try {
            await apiPatch(`/finance/fees/${feeId}/pay`, {});
        } catch {
            // Revert on error
            await loadCampaign();
        } finally {
            setPayingIds((prev) => {
                const next = new Set(prev);
                next.delete(feeId);
                return next;
            });
        }
    }

    if (loading) {
        return (
            <RequirePermission permissions={["finance.view"]}>
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
            </RequirePermission>
        );
    }

    if (!campaign) {
        return (
            <RequirePermission permissions={["finance.view"]}>
                <div className="text-center py-24 text-gray-400">
                    <p>Campagne introuvable.</p>
                    <button
                        onClick={() => router.push("/dashboard/finance")}
                        className="mt-4 text-blue-400 hover:underline cursor-pointer text-sm"
                    >
                        ← Retour aux finances
                    </button>
                </div>
            </RequirePermission>
        );
    }

    const isOverdue =
        new Date(campaign.due_date) < new Date() && campaign.progress < 100;
    const isBranchScope = campaign.scope === "NETWORK_BRANCHES";
    const scopeInfo = SCOPE_LABELS[campaign.scope] || SCOPE_LABELS.LOCAL;

    return (
        <RequirePermission permissions={["finance.view"]}>
            <div className="space-y-6">
                {/* Back + Header */}
                <div>
                    <button
                        onClick={() => router.push("/dashboard/finance")}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux finances
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-blue-400" />
                                {campaign.name}
                            </h2>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {formatCurrency(campaign.amount)} / {isBranchScope ? "antenne" : "membre"}
                                </span>
                                <span
                                    className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}
                                >
                                    <Calendar className="w-3 h-3" />
                                    Échéance : {formatDate(campaign.due_date)}
                                    {isOverdue && " (dépassée)"}
                                </span>
                                <span className="flex items-center gap-1">
                                    {isBranchScope ? (
                                        <Building2 className="w-3 h-3" />
                                    ) : (
                                        <Users className="w-3 h-3" />
                                    )}
                                    {campaign.totalMembers} {isBranchScope ? "antennes" : "membres"}
                                </span>
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                                    style={{
                                        backgroundColor: `${scopeInfo.color}15`,
                                        borderColor: `${scopeInfo.color}30`,
                                        color: scopeInfo.color,
                                    }}
                                >
                                    {scopeInfo.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress + Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <GlassCard className="!p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-300 font-medium">
                                    Progression globale
                                </p>
                                <span
                                    className={`text-lg font-bold ${campaign.progress === 100
                                        ? "text-emerald-400"
                                        : campaign.progress >= 50
                                            ? "text-blue-400"
                                            : "text-amber-400"
                                        }`}
                                >
                                    {campaign.progress}%
                                </span>
                            </div>
                            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${campaign.progress}%`,
                                        background:
                                            campaign.progress === 100
                                                ? "linear-gradient(90deg, #10b981, #34d399)"
                                                : campaign.progress >= 50
                                                    ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                                                    : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>
                                    {formatCurrency(campaign.totalCollected)}{" "}
                                    encaissé
                                </span>
                                <span>
                                    {formatCurrency(campaign.totalExpected)}{" "}
                                    attendu
                                </span>
                            </div>
                        </GlassCard>
                    </div>
                    <GlassCard className="!p-5 flex flex-col justify-center items-center text-center">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <p className="text-xs text-gray-400 uppercase tracking-wider">
                                À jour
                            </p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">
                            {campaign.paidMembers}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            sur {campaign.totalMembers} {isBranchScope ? "antennes" : "membres"}
                        </p>
                    </GlassCard>
                </div>

                {/* Fee Table */}
                <GlassCard className="!p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-white">
                            Suivi des paiements
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                        {isBranchScope ? "Antenne" : "Membre"}
                                    </th>
                                    {!isBranchScope && (
                                        <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                            {campaign.scope === "NETWORK_MEMBERS" ? "Association" : "Email"}
                                        </th>
                                    )}
                                    <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                        Montant dû
                                    </th>
                                    <th className="text-left text-gray-400 font-medium px-5 py-3.5">
                                        Statut
                                    </th>
                                    {canEdit && (
                                        <th className="text-right text-gray-400 font-medium px-5 py-3.5">
                                            Action
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {campaign.fees.map((fee) => {
                                    const isPaid = fee.status === "PAID";
                                    const isPaying = payingIds.has(fee.id);

                                    // Determine display based on fee type
                                    let displayName = "";
                                    let displaySub = "";
                                    let initials = "?";

                                    if (fee.targetAssociation) {
                                        // Branch fee
                                        displayName = fee.targetAssociation.name;
                                        displaySub = fee.targetAssociation.address_city || fee.targetAssociation.networkLevel;
                                        initials = fee.targetAssociation.name.slice(0, 2).toUpperCase();
                                    } else if (fee.user) {
                                        // Member fee
                                        const fullName = [
                                            fee.user.firstName,
                                            fee.user.lastName,
                                        ]
                                            .filter(Boolean)
                                            .join(" ");
                                        displayName = fullName || fee.user.email;
                                        displaySub = campaign.scope === "NETWORK_MEMBERS" && fee.user.association
                                            ? fee.user.association.name
                                            : fee.user.email;
                                        initials =
                                            (fee.user.firstName?.[0] || "") +
                                            (fee.user.lastName?.[0] || fee.user.email[0]);
                                    }

                                    return (
                                        <tr
                                            key={fee.id}
                                            className={`border-b border-white/5 transition-all duration-500 ${isPaid
                                                ? "bg-emerald-500/[0.04]"
                                                : "hover:bg-white/[0.03]"
                                                }`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${isPaid
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : fee.targetAssociation
                                                                ? "bg-purple-500/20 text-purple-400"
                                                                : "bg-white/10 text-white"
                                                            }`}
                                                    >
                                                        {fee.targetAssociation ? (
                                                            <Building2 className="w-3.5 h-3.5" />
                                                        ) : (
                                                            initials
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-medium">
                                                            {displayName}
                                                        </span>
                                                        {isBranchScope && fee.targetAssociation?.address_city && (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {fee.targetAssociation.address_city}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {!isBranchScope && (
                                                <td className="px-5 py-3.5 text-gray-300 text-xs">
                                                    {displaySub}
                                                </td>
                                            )}
                                            <td className="px-5 py-3.5 text-white font-semibold">
                                                {formatCurrency(
                                                    campaign.amount
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Payé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                                        <Clock className="w-3 h-3" />
                                                        En attente
                                                    </span>
                                                )}
                                            </td>
                                            {canEdit && (
                                                <td className="px-5 py-3.5 text-right">
                                                    {!isPaid ? (
                                                        <button
                                                            onClick={() =>
                                                                handlePay(
                                                                    fee.id
                                                                )
                                                            }
                                                            disabled={isPaying}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all duration-200 text-xs font-medium cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isPaying ? (
                                                                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            )}
                                                            Valider le paiement
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">
                                                            ✓ Validé
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </RequirePermission>
    );
}
