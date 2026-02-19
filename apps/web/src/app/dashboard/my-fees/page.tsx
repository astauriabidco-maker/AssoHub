"use client";

import { useEffect, useState } from "react";
import {
    Wallet,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock,
    CreditCard,
    Download,
    Loader2
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import { apiGet, apiPost, apiGetBlob } from "@/lib/api";

interface Fee {
    id: string;
    label: string;
    amount: number;
    status: "PAID" | "PENDING" | "OVERDUE" | "PROCESSING";
    dueDate: string;
    paidAt?: string;
}

interface PaymentConfig {
    provider: string;
    isEnabled: boolean;
}

const STATUS_CONFIG = {
    PAID: { label: "Payé", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    PENDING: { label: "En attente", icon: Clock, color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    OVERDUE: { label: "En retard", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    PROCESSING: { label: "Traitement...", icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
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
        month: "short",
        year: "numeric",
    });
}

export default function MyFeesPage() {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Payment Modal
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
    const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ provider: "MANUAL", isEnabled: false });
    const [payMethod, setPayMethod] = useState<"WALLET" | "ONLINE">("ONLINE");
    const [onlineProvider, setOnlineProvider] = useState<string>("STRIPE");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [payLoading, setPayLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [feesData, configData] = await Promise.all([
                apiGet<Fee[]>("/finance/fees/me"),
                apiGet<PaymentConfig>("/finance/config").catch(() => ({ provider: "MANUAL", isEnabled: false }))
            ]);
            setFees(feesData);
            setPaymentConfig(configData);
            if (configData.provider) setOnlineProvider(configData.provider);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function downloadReceipt(fee: Fee) {
        if (fee.status !== 'PAID') return;
        setProcessingId(fee.id);
        try {
            await apiGetBlob(`/finance/fees/${fee.id}/receipt`, `recu-${fee.id.substring(0, 8)}.pdf`);
        } catch (error) {
            alert("Erreur lors du téléchargement du reçu");
        } finally {
            setProcessingId(null);
        }
    }

    function openPayModal(fee: Fee) {
        setSelectedFee(fee);
        setPayMethod("ONLINE");
        setPhoneNumber("");
    }

    async function handlePayment() {
        if (!selectedFee) return;
        setPayLoading(true);
        try {
            if (payMethod === "WALLET") {
                await apiPost(`/finance/fees/${selectedFee.id}/pay-with-wallet`, {});
                alert("Paiement effectué avec succès !");
            } else {
                // Online Payment
                await apiPost(`/finance/fees/${selectedFee.id}/pay-online`, {
                    provider: onlineProvider,
                    phoneNumber: (onlineProvider === 'ORANGE_MONEY' || onlineProvider === 'MTNC') ? phoneNumber : undefined
                });
                alert("Paiement initié. Veuillez suivre les instructions (SMS/App validation) ou vérifier votre statut.");
            }
            setSelectedFee(null);
            await loadData();
        } catch (error: any) {
            alert(error.message || "Erreur lors du paiement");
        } finally {
            setPayLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    Mes Cotisations
                </h2>
                <GlassButton onClick={loadData} variant="ghost" icon={<Clock className="w-3 h-3" />}>
                    Actualiser
                </GlassButton>
            </div>

            <GlassCard className="!p-0 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                ) : fees.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
                        <p>Vous êtes à jour ! Aucune cotisation en cours.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-gray-400 font-medium px-5 py-3.5">Campagne</th>
                                    <th className="text-left text-gray-400 font-medium px-5 py-3.5">Echéance</th>
                                    <th className="text-right text-gray-400 font-medium px-5 py-3.5">Montant</th>
                                    <th className="text-center text-gray-400 font-medium px-5 py-3.5">Statut</th>
                                    <th className="text-right text-gray-400 font-medium px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map((fee) => {
                                    const status = STATUS_CONFIG[fee.status] || STATUS_CONFIG.PENDING;
                                    const Icon = status.icon;
                                    return (
                                        <tr key={fee.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-white">{fee.label}</td>
                                            <td className="px-5 py-3.5 text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(fee.dueDate)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-white">
                                                {formatCurrency(fee.amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border}`}>
                                                    <Icon className={`w-3 h-3 ${fee.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {fee.status === 'PAID' ? (
                                                    <GlassButton
                                                        
                                                        variant="ghost"
                                                        onClick={() => downloadReceipt(fee)}
                                                        isLoading={processingId === fee.id}
                                                        icon={<Download className="w-3 h-3" />}
                                                    >
                                                        Reçu
                                                    </GlassButton>
                                                ) : fee.status === 'PROCESSING' ? (
                                                    <span className="text-xs text-blue-400 italic">Validation en cours...</span>
                                                ) : (
                                                    <GlassButton onClick={() => openPayModal(fee)}>
                                                        Payer
                                                    </GlassButton>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Payment Modal */}
            <GlassModal
                open={!!selectedFee}
                onClose={() => setSelectedFee(null)}
                title={`Payer: ${selectedFee?.label}`}
            >
                <div className="space-y-6">
                    <div className="text-center py-2 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-gray-400">Montant à régler</p>
                        <p className="text-2xl font-bold text-white mt-1">{selectedFee && formatCurrency(selectedFee.amount)}</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-300">Moyen de paiement</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPayMethod("ONLINE")}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${payMethod === "ONLINE"
                                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                <CreditCard className="w-5 h-5 mb-2 mx-auto" />
                                Paiement Direct
                            </button>
                            <button
                                onClick={() => setPayMethod("WALLET")}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${payMethod === "WALLET"
                                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                <Wallet className="w-5 h-5 mb-2 mx-auto" />
                                Mon Portefeuille
                            </button>
                        </div>
                    </div>

                    {payMethod === "ONLINE" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Fournisseur</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm"
                                    value={onlineProvider}
                                    onChange={(e) => setOnlineProvider(e.target.value)}
                                >
                                    <option value="STRIPE" className="bg-gray-900">Carte Bancaire (Stripe)</option>
                                    <option value="ORANGE_MONEY" className="bg-gray-900">Orange Money</option>
                                    <option value="MTNC" className="bg-gray-900">MTN Mobile Money</option>
                                </select>
                            </div>

                            {(onlineProvider === 'ORANGE_MONEY' || onlineProvider === 'MTNC') && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Numéro de téléphone</label>
                                    <input
                                        type="tel"
                                        placeholder="6....."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            )}

                            {!paymentConfig.isEnabled && (
                                <div className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                    ⚠️ Les paiements sont actuellement configurés en mode "MANUAL" par l'administrateur, mais la simulation est active.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <GlassButton variant="ghost" onClick={() => setSelectedFee(null)} className="flex-1">
                            Annuler
                        </GlassButton>
                        <GlassButton
                            className="flex-1"
                            onClick={handlePayment}
                            isLoading={payLoading}
                            disabled={payMethod === 'ONLINE' && (onlineProvider === 'ORANGE_MONEY' || onlineProvider === 'MTNC') && !phoneNumber}
                        >
                            Payer maintenant
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </div>
    );
}
