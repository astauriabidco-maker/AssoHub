import { WalletTransaction } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionHistoryProps {
    transactions: WalletTransaction[];
    isLoading?: boolean;
}

export function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
    if (isLoading) {
        return <GlassCard className="h-64 animate-pulse"><div className="bg-white/10 h-full w-full rounded"></div></GlassCard>;
    }

    return (
        <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Historique des transactions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Description</th>
                            <th className="px-6 py-3 font-medium text-right">Montant</th>
                            <th className="px-6 py-3 font-medium text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Aucune transaction récente
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                tx.type === 'WITHDRAWAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {tx.type === 'DEPOSIT' && <ArrowDownLeft className="w-3 h-3" />}
                                            {tx.type === 'WITHDRAWAL' && <ArrowUpRight className="w-3 h-3" />}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {tx.description || '-'}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'
                                        }`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('fr-FR')} XAF
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs ${tx.status === 'COMPLETED' ? 'text-emerald-400' :
                                                tx.status === 'PENDING' ? 'text-amber-400' :
                                                    'text-red-400'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}
