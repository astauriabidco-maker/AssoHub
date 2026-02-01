'use client';

import React, { useEffect, useState } from 'react';
import {
    Building2,
    Search,
    Loader2,
    Trash2,
    AlertTriangle,
    X,
    CheckCircle,
    XCircle,
} from 'lucide-react';

interface Association {
    id: string;
    name: string;
    slug: string | null;
    adminEmail: string;
    plan: string;
    memberCount: number;
    isActive: boolean;
    createdAt: string;
}

export default function AssociationsManagement() {
    const [associations, setAssociations] = useState<Association[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [deleteModal, setDeleteModal] = useState<Association | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchAssociations();
    }, []);

    const fetchAssociations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/associations`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                if (res.status === 403) {
                    setError('Accès refusé.');
                } else {
                    setError('Erreur de chargement.');
                }
                return;
            }

            const data = await res.json();
            setAssociations(data);
        } catch {
            setError('Impossible de se connecter au serveur.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSuspend = async (id: string) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/associations/${id}/suspend`,
                {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.ok) {
                const updated = await res.json();
                setAssociations((prev) =>
                    prev.map((a) =>
                        a.id === id ? { ...a, isActive: updated.isActive } : a
                    )
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteAssociation = async () => {
        if (!deleteModal) return;

        setActionLoading(deleteModal.id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/associations/${deleteModal.id}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.ok) {
                setAssociations((prev) =>
                    prev.filter((a) => a.id !== deleteModal.id)
                );
                setDeleteModal(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredAssociations = associations.filter(
        (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.adminEmail.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getPlanBadge = (plan: string) => {
        switch (plan) {
            case 'PRO':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'ENTERPRISE':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Gestion des Associations
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {associations.length} associations enregistrées
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                                Association
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                                Email Admin
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                                Plan
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                                Membres
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                                Date
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                                Statut
                            </th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssociations.map((asso) => (
                            <tr
                                key={asso.id}
                                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                {asso.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {asso.slug || 'No slug'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {asso.adminEmail}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium border ${getPlanBadge(
                                            asso.plan
                                        )}`}
                                    >
                                        {asso.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {asso.memberCount}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {formatDate(asso.createdAt)}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleSuspend(asso.id)}
                                        disabled={actionLoading === asso.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${asso.isActive
                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}
                                    >
                                        {actionLoading === asso.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : asso.isActive ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        {asso.isActive ? 'Actif' : 'Suspendu'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setDeleteModal(asso)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {/* Note: Impersonation coming later */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredAssociations.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Aucune association trouvée.
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Supprimer l'association
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Cette action est irréversible
                                </p>
                            </div>
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="ml-auto p-2 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Êtes-vous sûr de vouloir supprimer{' '}
                            <strong className="text-white">{deleteModal.name}</strong> ?
                            Toutes les données associées seront perdues.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={deleteAssociation}
                                disabled={actionLoading === deleteModal.id}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                {actionLoading === deleteModal.id && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
