"use client";

import { useEffect, useState } from 'react';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { Wallet } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/api';

export default function WalletPage() {
    const { user } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem('token');
        setToken(t);
    }, []);

    const fetchWallet = async () => {
        if (!token) return;
        try {
            // Fetch wallet summary
            const res = await fetch(`${API_URL}/wallet/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [token]);

    const handleTopUp = async (amount: number, method: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/wallet/top-up`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount, method })
            });

            if (res.ok) {
                await fetchWallet(); // Refresh
                alert('Rechargement initié avec succès !');
            } else {
                alert('Erreur lors du rechargement');
            }
        } catch (e) {
            console.error(e);
            alert('Erreur technique');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Mon Portefeuille</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <WalletCard
                        wallet={wallet}
                        isLoading={isLoading}
                        onTopUp={() => setIsModalOpen(true)}
                    />
                </div>
                <div className="md:col-span-2">
                    <TransactionHistory
                        transactions={wallet?.transactions || []}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            <TopUpModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleTopUp}
            />
        </div>
    );
}
