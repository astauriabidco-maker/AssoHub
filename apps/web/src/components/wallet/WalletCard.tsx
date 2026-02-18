import { Wallet } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { Plus } from 'lucide-react';

interface WalletCardProps {
    wallet: Wallet | null;
    onTopUp: () => void;
    isLoading?: boolean;
}

export function WalletCard({ wallet, onTopUp, isLoading }: WalletCardProps) {
    if (isLoading) {
        return (
            <GlassCard className="animate-pulse h-48">
                <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                <div className="h-10 w-48 bg-white/10 rounded"></div>
            </GlassCard>
        );
    }

    if (!wallet) return (
        <GlassCard>
            <div className="text-center text-gray-400">
                Portefeuille non activé
            </div>
        </GlassCard>
    );

    return (
        <GlassCard className="relative overflow-hidden">
            {/* Background gradient blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Solde disponible</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white tracking-tight">
                            {wallet.balance.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xl text-gray-400 font-medium">
                            {wallet.currency}
                        </span>
                    </div>
                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${wallet.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {wallet.status === 'ACTIVE' ? 'Compte actif' : 'Compte bloqué'}
                    </div>
                </div>

                <div className="mt-8">
                    <GlassButton
                        onClick={onTopUp}
                        className="w-full justify-center group"
                        icon={<Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />}
                    >
                        Alimenter mon compte
                    </GlassButton>
                </div>
            </div>
        </GlassCard>
    );
}
