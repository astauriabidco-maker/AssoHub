"use client";

import React, { useEffect, useState } from "react";
import {
    Plus, Wallet, TrendingUp, AlertCircle, Calendar, Users, Loader2, ArrowUpRight,
    Download, Receipt, BookOpen, LayoutDashboard, ArrowDownLeft, Minus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Campaign {
    id: string;
    name: string;
    amount: number;
    due_date: string;
    _count: {
        fees: number;
    };
}

interface Stats {
    totalCollectable: number;
    totalReceived: number;
    remaining: number;
}

interface Transaction {
    id: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    category?: string;
    paymentMethod?: string;
    date: string;
    balance?: number;
}

interface LedgerData {
    transactions: Transaction[];
    currentBalance: number;
}

const TABS = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "campaigns", label: "Cotisations", icon: Wallet },
    { id: "expenses", label: "Dépenses", icon: Receipt },
    { id: "ledger", label: "Grand Livre", icon: BookOpen },
];

const EXPENSE_CATEGORIES = [
    "Transport",
    "Alimentation",
    "Location",
    "Matériel",
    "Communication",
    "Assurance",
    "Autre",
];

const PAYMENT_METHODS = ["Virement", "Chèque", "Espèces", "Carte bancaire"];

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<Stats>({ totalCollectable: 0, totalReceived: 0, remaining: 0 });
    const [expenses, setExpenses] = useState<Transaction[]>([]);
    const [ledgerData, setLedgerData] = useState<LedgerData>({ transactions: [], currentBalance: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        dueDate: "",
    });
    const [expenseForm, setExpenseForm] = useState({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        paymentMethod: "",
    });

    const fetchData = async () => {
        try {
            const [campaignsData, statsData, expensesData, ledgerResp] = await Promise.all([
                apiFetch("/finance/campaigns"),
                apiFetch("/finance/stats"),
                apiFetch("/finance/expenses"),
                apiFetch("/finance/ledger"),
            ]);
            setCampaigns(campaignsData);
            setStats(statsData);
            setExpenses(expensesData);
            setLedgerData(ledgerResp);
        } catch (error) {
            console.error("Failed to fetch finance data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch("/finance/campaigns", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                }),
            });
            setIsModalOpen(false);
            setFormData({ name: "", amount: "", dueDate: "" });
            fetchData();
        } catch (error) {
            console.error("Failed to create campaign:", error);
            alert("Erreur lors du lancement de la campagne.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch("/finance/expense", {
                method: "POST",
                body: JSON.stringify({
                    ...expenseForm,
                    amount: parseFloat(expenseForm.amount),
                }),
            });
            setIsExpenseModalOpen(false);
            setExpenseForm({
                amount: "",
                date: new Date().toISOString().split("T")[0],
                description: "",
                category: "",
                paymentMethod: "",
            });
            fetchData();
        } catch (error) {
            console.error("Failed to create expense:", error);
            alert("Erreur lors de la saisie de la dépense.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportCsv = async () => {
        try {
            const token = localStorage.getItem("assohub_token");
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${apiBase}/finance/export`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "grand_livre.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("Failed to export CSV:", error);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Finance</h1>
                        <p className="text-white/60 mt-1">Gérez vos recettes, dépenses et comptabilité</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <OverviewTab
                        stats={stats}
                        campaigns={campaigns}
                        ledgerData={ledgerData}
                        loading={loading}
                    />
                )}

                {activeTab === "campaigns" && (
                    <CampaignsTab
                        campaigns={campaigns}
                        loading={loading}
                        onOpenModal={() => setIsModalOpen(true)}
                    />
                )}

                {activeTab === "expenses" && (
                    <ExpensesTab
                        expenses={expenses}
                        loading={loading}
                        onOpenModal={() => setIsExpenseModalOpen(true)}
                    />
                )}

                {activeTab === "ledger" && (
                    <LedgerTab
                        ledgerData={ledgerData}
                        loading={loading}
                        onExport={handleExportCsv}
                    />
                )}
            </div>

            {/* Create Campaign Dialog */}
            <Dialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Lancer une campagne d'adhésion"
            >
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Nom de la campagne</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Adhésion 2026"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Montant (€)</label>
                            <input
                                type="number"
                                required
                                placeholder="50"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Échéance</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={18} className="animate-spin" />}
                        Lancer la campagne
                    </button>
                </form>
            </Dialog>

            {/* Create Expense Dialog */}
            <Dialog
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Saisir une dépense"
            >
                <form onSubmit={handleCreateExpense} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Montant (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="150.00"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={expenseForm.amount}
                                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60 uppercase">Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={expenseForm.date}
                                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Catégorie</label>
                        <select
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        >
                            <option value="" className="bg-slate-900">Sélectionner...</option>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Méthode de paiement</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={expenseForm.paymentMethod}
                            onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                        >
                            <option value="" className="bg-slate-900">Sélectionner...</option>
                            {PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method} className="bg-slate-900">{method}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase">Description</label>
                        <input
                            type="text"
                            placeholder="Ex: Loyer bureau janvier"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={18} className="animate-spin" />}
                        <Minus size={18} />
                        Enregistrer la dépense
                    </button>
                </form>
            </Dialog>
        </div>
    );
}

// ===================== TAB COMPONENTS =====================

function OverviewTab({ stats, campaigns, ledgerData, loading }: { stats: Stats; campaigns: Campaign[]; ledgerData: LedgerData; loading: boolean }) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/50">Solde actuel</p>
                            <h3 className={cn(
                                "text-2xl font-bold mt-1",
                                ledgerData.currentBalance >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                                {loading ? <Skeleton className="h-8 w-24" /> : `${ledgerData.currentBalance.toFixed(2)} €`}
                            </h3>
                        </div>
                        <div className={cn(
                            "p-3 rounded-xl",
                            ledgerData.currentBalance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                            <Wallet size={24} />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/50">Total à collecter</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {loading ? <Skeleton className="h-8 w-24" /> : `${stats.totalCollectable} €`}
                            </h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/50">Reçu</p>
                            <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                                {loading ? <Skeleton className="h-8 w-24" /> : `${stats.totalReceived} €`}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/50">Reste à percevoir</p>
                            <h3 className="text-2xl font-bold text-amber-400 mt-1">
                                {loading ? <Skeleton className="h-8 w-24" /> : `${stats.remaining} €`}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Recent Transactions */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Dernières opérations</h3>
                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))
                    ) : ledgerData.transactions.slice(0, 5).length === 0 ? (
                        <p className="text-white/40 text-center py-4">Aucune opération enregistrée</p>
                    ) : (
                        ledgerData.transactions.slice(0, 5).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        tx.type === "INCOME" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                    )}>
                                        {tx.type === "INCOME" ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{tx.description || tx.category || "Transaction"}</p>
                                        <p className="text-xs text-white/40">{new Date(tx.date).toLocaleDateString("fr-FR")}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "font-bold",
                                    tx.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {tx.type === "INCOME" ? "+" : ""}{tx.amount.toFixed(2)} €
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
}

function CampaignsTab({ campaigns, loading, onOpenModal }: { campaigns: Campaign[]; loading: boolean; onOpenModal: () => void }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={onOpenModal}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus size={20} />
                    Lancer une campagne
                </button>
            </div>

            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Campagne</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Montant/u</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Échéance</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Cibles</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-40" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                                        Aucune campagne lancée.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-white/5 cursor-pointer" onClick={() => window.location.href = `/dashboard/finance/${campaign.id}`}>
                                        <td className="px-6 py-4 font-medium text-white">{campaign.name}</td>
                                        <td className="px-6 py-4 text-white/70">{campaign.amount} €</td>
                                        <td className="px-6 py-4 text-white/70">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-white/30" />
                                                {new Date(campaign.due_date).toLocaleDateString("fr-FR")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary">
                                                <Users size={12} className="mr-1" />
                                                {campaign._count.fees}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge variant={new Date(campaign.due_date) < new Date() ? "warning" : "success"}>
                                                {new Date(campaign.due_date) < new Date() ? "Expiré" : "En cours"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}

function ExpensesTab({ expenses, loading, onOpenModal }: { expenses: Transaction[]; loading: boolean; onOpenModal: () => void }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={onOpenModal}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg shadow-red-500/20 transition-all"
                >
                    <Minus size={20} />
                    Saisir une dépense
                </button>
            </div>

            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Catégorie</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase">Méthode</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-40" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                                        Aucune dépense enregistrée.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/5">
                                        <td className="px-6 py-4 text-white/70">
                                            {new Date(expense.date).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary">{expense.category || "—"}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-white">{expense.description || "—"}</td>
                                        <td className="px-6 py-4 text-white/50">{expense.paymentMethod || "—"}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-400">
                                            {expense.amount.toFixed(2)} €
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}

function LedgerTab({ ledgerData, loading, onExport }: { ledgerData: LedgerData; loading: boolean; onExport: () => void }) {
    return (
        <div className="space-y-6">
            {/* Balance Header */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white/50 uppercase font-semibold">Solde Total</p>
                        <h2 className={cn(
                            "text-4xl font-black mt-1",
                            ledgerData.currentBalance >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                            {ledgerData.currentBalance.toFixed(2)} €
                        </h2>
                    </div>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all"
                    >
                        <Download size={18} />
                        Exporter (CSV)
                    </button>
                </div>
            </GlassCard>

            {/* Ledger Table - Excel Style */}
            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-white/10">
                                <th className="px-4 py-3 font-bold text-white/70 border-r border-white/5">Date</th>
                                <th className="px-4 py-3 font-bold text-white/70 border-r border-white/5">Type</th>
                                <th className="px-4 py-3 font-bold text-white/70 border-r border-white/5">Catégorie</th>
                                <th className="px-4 py-3 font-bold text-white/70 border-r border-white/5">Libellé</th>
                                <th className="px-4 py-3 font-bold text-white/70 border-r border-white/5 text-right">Montant</th>
                                <th className="px-4 py-3 font-bold text-white/70 text-right">Solde</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : ledgerData.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-white/40">
                                        Aucune écriture comptable.
                                    </td>
                                </tr>
                            ) : (
                                ledgerData.transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5">
                                        <td className="px-4 py-3 text-white/60 border-r border-white/5 font-mono">
                                            {new Date(tx.date).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-4 py-3 border-r border-white/5">
                                            <Badge variant={tx.type === "INCOME" ? "success" : "destructive"} className="text-xs">
                                                {tx.type === "INCOME" ? "Recette" : "Dépense"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-white/60 border-r border-white/5">
                                            {tx.category || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-white border-r border-white/5">
                                            {tx.description || "—"}
                                        </td>
                                        <td className={cn(
                                            "px-4 py-3 text-right font-mono font-bold border-r border-white/5",
                                            tx.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                                        )}>
                                            {tx.type === "INCOME" ? "+" : ""}{tx.amount.toFixed(2)} €
                                        </td>
                                        <td className={cn(
                                            "px-4 py-3 text-right font-mono font-bold",
                                            (tx.balance || 0) >= 0 ? "text-white" : "text-red-400"
                                        )}>
                                            {(tx.balance || 0).toFixed(2)} €
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
