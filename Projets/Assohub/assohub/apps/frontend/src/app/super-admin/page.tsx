'use client';

import React, { useEffect, useState } from 'react';
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    Loader2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface Stats {
    totalAssociations: number;
    totalUsers: number;
    estimatedMonthlyRevenue: number;
    totalTransactionVolume: number;
    monthlyNewAssociations: { month: string; count: number }[];
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/stats`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                if (res.status === 403) {
                    setError('Accès refusé. Vous devez être Super Admin.');
                } else {
                    setError('Erreur lors du chargement des statistiques.');
                }
                return;
            }

            const data = await res.json();
            setStats(data);
        } catch {
            setError('Impossible de se connecter au serveur.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Accès Refusé</h2>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    const kpis = [
        {
            label: 'Associations',
            value: stats?.totalAssociations || 0,
            icon: Building2,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            label: 'Utilisateurs',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'from-purple-500 to-pink-500',
        },
        {
            label: 'Revenu Mensuel',
            value: `${stats?.estimatedMonthlyRevenue || 0}€`,
            icon: DollarSign,
            color: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Volume Transactions',
            value: `${(stats?.totalTransactionVolume || 0).toLocaleString()}€`,
            icon: TrendingUp,
            color: 'from-orange-500 to-red-500',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Dashboard Super Admin
                </h1>
                <p className="text-gray-400">
                    Vue d'ensemble de la plateforme AssoHub
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.label}
                            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-1">{kpi.label}</p>
                            <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Chart */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">
                    Nouvelles Associations par Mois
                </h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.monthlyNewAssociations || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="month"
                                stroke="#9CA3AF"
                                tick={{ fill: '#9CA3AF' }}
                            />
                            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: '#F9FAFB' }}
                                itemStyle={{ color: '#EF4444' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="url(#colorGradient)"
                                radius={[4, 4, 0, 0]}
                            />
                            <defs>
                                <linearGradient
                                    id="colorGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#EF4444" />
                                    <stop offset="100%" stopColor="#F97316" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
