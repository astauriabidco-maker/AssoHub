"use client";

import { useEffect, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';
import GlassButton from '@/components/ui/GlassButton';
import { apiGet, apiPost } from '@/lib/api';
import { AlertCircle, Calendar, CheckCircle2, CreditCard, Loader2, Smartphone, Wallet } from 'lucide-react';

interface Fee {
    id: string;
    label: string;
    amount: number;
    status: string;
    dueDate: string;
}

interface PaymentConfig {
    provider: string; // MANUAL, STRIPE, ORANGE_MONEY, MTNC
    isEnabled: boolean;
}

interface PendingFeesListProps {
    walletBalance: number;
    onPaymentSuccess: () => void;
}

export function PendingFeesList({ walletBalance, onPaymentSuccess }: PendingFeesListProps) {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<PaymentConfig | null>(null);

    // Payment State
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'ONLINE' | null>(null);
    const [processing, setProcessing] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(''); // For Mobile Money
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const [feesData, configData] = await Promise.all([
                apiGet<Fee[]>('/finance/fees/me'),
                apiGet<PaymentConfig>('/finance/config').catch(() => null)
            ]);

            setFees(feesData.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE'));
            if (configData) setConfig(configData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleInitialClick = (fee: Fee) => {
        setError(null);
        setSelectedFee(fee);
        setPaymentMethod(null);
        setPhoneNumber('');
    };

    const handlePayWithWallet = async () => {
        if (!selectedFee) return;
        if (walletBalance < selectedFee.amount) {
            setError(`Solde insuffisant (${walletBalance} XAF). Rechargez votre portefeuille ou payez en ligne.`);
            return;
        }

        setProcessing(true);
        try {
            await apiPost(`/finance/fees/${selectedFee.id}/pay-with-wallet`, {});
            handleSuccess();
        } catch (err: any) {
            setError(err.message || "Erreur lors du paiement");
        } finally {
            setProcessing(false);
        }
    };

    const handlePayOnline = async () => {
        if (!selectedFee || !config) return;

        // Basic validation for Mobile Money
        if ((config.provider === 'ORANGE_MONEY' || config.provider === 'MTNC') && !phoneNumber) {
            setError("Veuillez entrer un numéro de téléphone");
            return;
        }

        setProcessing(true);
        try {
            await apiPost(`/finance/fees/${selectedFee.id}/pay-online`, {
                provider: config.provider,
                phoneNumber
            });
            handleSuccess();
        } catch (err: any) {
            setError(err.message || "Erreur lors du paiement en ligne");
        } finally {
            setProcessing(false);
        }
    };

    const handleSuccess = () => {
        if (selectedFee) {
            setFees(prev => prev.filter(f => f.id !== selectedFee.id));
        }
        setSelectedFee(null);
        onPaymentSuccess();
        // Maybe show toast
    };

    if (loading) return <div className="text-center py-4 text-gray-500">Chargement des cotisations...</div>;

    if (fees.length === 0) {
        return (
            <GlassCard className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-white font-medium">Tout est à jour !</h3>
                <p className="text-sm text-gray-400">Aucune cotisation en attente.</p>
            </GlassCard>
        );
    }

    return (
        <>
            <GlassCard className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-semibold text-white">Cotisations en attente</h3>
                </div>

                <div className="space-y-3">
                    {fees.map((fee) => (
                        <div
                            key={fee.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                        >
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{fee.label}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span className={`flex items-center gap-1 ${fee.status === 'OVERDUE' ? 'text-red-400' : ''}`}>
                                        <Calendar className="w-3 h-3" />
                                        {new Date(fee.dueDate).toLocaleDateString()}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 text-[10px] uppercase">
                                        {fee.status === 'OVERDUE' ? 'En retard' : 'À payer'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 justify-between sm:justify-end">
                                <span className="text-white font-bold whitespace-nowrap">
                                    {fee.amount.toLocaleString()} XAF
                                </span>

                                <button
                                    onClick={() => handleInitialClick(fee)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-white text-xs font-medium"
                                >
                                    <span className="hidden sm:inline">Payer</span>
                                    <span className="sm:hidden">Pay</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Payment Selection Modal */}
            <GlassModal
                open={!!selectedFee}
                onClose={() => setSelectedFee(null)}
                title={`Payer : ${selectedFee?.label}`}
            >
                <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-gray-400">Montant à payer</span>
                        <span className="text-2xl font-bold text-white">{selectedFee?.amount.toLocaleString()} XAF</span>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    {!paymentMethod ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-300 mb-2">Choisissez une méthode :</p>

                            {/* METHOD 1: WALLET */}
                            <button
                                onClick={() => setPaymentMethod('WALLET')}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-white group-hover:text-blue-400 transition-colors">Portefeuille Virtuel</p>
                                        <p className="text-xs text-gray-400">Solde : {walletBalance.toLocaleString()} XAF</p>
                                    </div>
                                </div>
                            </button>

                            {/* METHOD 2: ONLINE (If Enabled) */}
                            {config?.isEnabled && config.provider !== 'MANUAL' && (
                                <button
                                    onClick={() => setPaymentMethod('ONLINE')}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                                            {config.provider === 'STRIPE' ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                {config.provider === 'STRIPE' ? 'Carte Bancaire' :
                                                    config.provider === 'ORANGE_MONEY' ? 'Orange Money' :
                                                        config.provider === 'MTNC' ? 'MTN Mobile Money' : 'Paiement en ligne'}
                                            </p>
                                            <p className="text-xs text-gray-400">Paiement direct sécurisé</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    ) : paymentMethod === 'WALLET' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <p className="text-sm text-gray-300">
                                Vous allez débiter <strong>{selectedFee?.amount.toLocaleString()} XAF</strong> de votre portefeuille.
                            </p>
                            {walletBalance < (selectedFee?.amount || 0) && (
                                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                                    Attention : Solde insuffisant.
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <GlassButton variant="secondary" onClick={() => setPaymentMethod(null)} disabled={processing}>Retour</GlassButton>
                                <GlassButton
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                    onClick={handlePayWithWallet}
                                    isLoading={processing}
                                    disabled={walletBalance < (selectedFee?.amount || 0)}
                                >
                                    Confirmer le paiement
                                </GlassButton>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            {/* ONLINE PAYMENT FORM */}
                            <p className="text-sm text-gray-300">
                                Paiement via {config?.provider === 'STRIPE' ? 'Carte Bancaire' :
                                    config?.provider === 'ORANGE_MONEY' ? 'Orange Money' : config?.provider}
                            </p>

                            {(config?.provider === 'ORANGE_MONEY' || config?.provider === 'MTNC') && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Numéro de téléphone</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                        placeholder="699 99 99 99"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            )}

                            {config?.provider === 'STRIPE' && (
                                <div className="p-3 bg-blue-500/10 text-blue-300 text-xs rounded-lg">
                                    Simulateur : Le paiement sera validé automatiquement.
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <GlassButton variant="secondary" onClick={() => setPaymentMethod(null)} disabled={processing}>Retour</GlassButton>
                                <GlassButton
                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                    onClick={handlePayOnline} // Make sure this calls handlePayOnline
                                    isLoading={processing}
                                >
                                    Payer maintenant
                                </GlassButton>
                            </div>
                        </div>
                    )}
                </div>
            </GlassModal>
        </>
    );
}
