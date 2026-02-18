import { useState } from 'react';
import GlassModal from '@/components/ui/GlassModal';
import GlassButton from '@/components/ui/GlassButton';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, method: string) => Promise<void>;
}

export function TopUpModal({ isOpen, onClose, onConfirm }: TopUpModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<string>('ORANGE_MONEY');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (!val || val <= 0) return;

        setIsLoading(true);
        try {
            await onConfirm(val, method);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassModal open={isOpen} onClose={onClose} title="Alimenter mon compte">
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Montant (XAF)</label>
                    <input
                        type="number"
                        min="100"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ex: 5000"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Moyen de paiement</label>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors [&>option]:text-black"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                    >
                        <option value="ORANGE_MONEY">Orange Money</option>
                        <option value="MTN_MOMO">MTN Mobile Money</option>
                        <option value="CARD">Carte Bancaire</option>
                    </select>
                </div>

                <div className="pt-4 flex gap-3">
                    <GlassButton type="button" variant="ghost" onClick={onClose} className="flex-1 justify-center">
                        Annuler
                    </GlassButton>
                    <GlassButton type="submit" isLoading={isLoading} className="flex-1 justify-center">
                        Confirmer
                    </GlassButton>
                </div>
            </form>
        </GlassModal>
    );
}
