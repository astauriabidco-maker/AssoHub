"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Clock,
    Plus,
    ChevronRight,
    Calendar,
    Users,
    Target,
    Network,
    Building2,
    BookOpen,
    Receipt,
    ArrowDownCircle,
    ArrowUpCircle,
    Download,
    CreditCard,
    Landmark,
    Settings,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPost, apiPatch, apiGetBlob } from "@/lib/api";

/* ─────────────────── Types ─────────────────── */
interface CampaignStats {
    id: string;
    name: string;
    description: string | null;
    amount: number;
    due_date: string;
    scope: string;
    frequency?: string;
    createdAt: string;
    totalMembers: number;
    paidMembers: number;
    totalExpected: number;
    totalCollected: number;
    progress: number;
}

interface GlobalStats {
    totalExpected: number;
    totalCollected: number;
    remaining: number;
}

interface TreasuryAccount {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
}

interface LedgerTransaction {
    id: string;
    date: string;
    type: string;
    category: string | null;
    description: string | null;
    amount: number;
    paymentMethod: string | null;
    treasuryAccount?: string | null;
    createdAt: string;
}

interface LedgerData {
    currentBalance: number;
    totalIncome: number;
    totalExpense: number;
    transactions: LedgerTransaction[];
}

interface PaymentConfig {
    provider: string; // MANUAL, STRIPE, ORANGE_MONEY, MTNC
    publicKey: string;
    secretKey: string;
    isEnabled: boolean;
}

const SCOPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    LOCAL: { label: "Local", color: "#6366f1", icon: "👤" },
    NETWORK_MEMBERS: { label: "Réseau (Membres)", color: "#3b82f6", icon: "👥" },
    NETWORK_BRANCHES: { label: "Réseau (Antennes)", color: "#8b5cf6", icon: "🏢" },
};

const EXPENSE_CATEGORIES = [
    { value: "LOYER", label: "🏠 Loyer" },
    { value: "ASSURANCE", label: "🛡️ Assurance" },
    { value: "TRANSPORT", label: "🚗 Transport" },
    { value: "MATERIEL", label: "🔧 Matériel" },
    { value: "EVENEMENT", label: "🎉 Événement" },
    { value: "AUTRE", label: "📦 Autre" },
];

const PAYMENT_METHODS = [
    { value: "CASH", label: "💵 Espèces" },
    { value: "BANK_TRANSFER", label: "🏦 Virement" },
    { value: "MOBILE_MONEY", label: "📱 Mobile Money" },
    { value: "CARD", label: "💳 Carte" },
    { value: "OTHER", label: "🔄 Autre" },
];

const ACCOUNT_TYPES = [
    { value: "CASH", label: "💵 Caisse (Espèces)" },
    { value: "BANK", label: "🏦 Compte Bancaire" },
    { value: "MOBILE_MONEY", label: "📱 Mobile Money" },
    { value: "OTHER", label: "🔄 Autre" },
];

const PAYMENT_PROVIDERS = [
    { value: "MANUAL", label: "Désactivé (Manuel uniquement)" },
    { value: "STRIPE", label: "Stripe (Carte Bancaire)" },
    { value: "ORANGE_MONEY", label: "Orange Money" },
    { value: "MTNC", label: "MTN Mobile Money" },
];

const CATEGORY_LABELS: Record<string, string> = {
    COTISATION: "Cotisation",
    DON: "Don",
    SUBVENTION: "Subvention",
    LOYER: "Loyer",
    ASSURANCE: "Assurance",
    TRANSPORT: "Transport",
    MATERIEL: "Matériel",
    EVENEMENT: "Événement",
    ACHAT: "Achat",
    AUTRE: "Autre",
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

type TabKey = "campaigns" | "treasury" | "expenses" | "ledger" | "config";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "campaigns", label: "Campagnes", icon: Target },
    { key: "treasury", label: "Trésorerie", icon: Landmark },
    { key: "expenses", label: "Dépenses", icon: Receipt },
    { key: "ledger", label: "Grand Livre", icon: BookOpen },
    { key: "config", label: "Paramètres", icon: Settings },
];

/* ─────────────────── Main Page ─────────────────── */
export default function FinancePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>("campaigns");

    // ── Campaigns data ──
    const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
    const [stats, setStats] = useState<GlobalStats>({
        totalExpected: 0,
        totalCollected: 0,
        remaining: 0,
    });
    const [loading, setLoading] = useState(true);
    const [hasChildren, setHasChildren] = useState(false);

    // ── Treasury data ──
    const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
    const [treasuryLoading, setTreasuryLoading] = useState(false);

    // ── Campaign Modal ──
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ name: "", amount: "", due_date: "", scope: "LOCAL", frequency: "ONETIME" });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    // ── Account Modal ──
    const [accModalOpen, setAccModalOpen] = useState(false);
    const [accForm, setAccForm] = useState({ name: "", type: "CASH", initialBalance: "0" });
    const [accFormLoading, setAccFormLoading] = useState(false);

    // ── Expense Modal ──
    const [expModalOpen, setExpModalOpen] = useState(false);
    const [expForm, setExpForm] = useState({
        amount: "",
        category: "AUTRE",
        paymentMethod: "CASH",
        date: new Date().toISOString().split("T")[0],
        description: "",
        treasuryAccountId: ""
    });
    const [expFormLoading, setExpFormLoading] = useState(false);
    const [expFormError, setExpFormError] = useState("");

    // ── Ledger data ──
    const [ledger, setLedger] = useState<LedgerData | null>(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    // ── Payment Config ──
    const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ provider: "MANUAL", publicKey: "", secretKey: "", isEnabled: false });
    const [configLoading, setConfigLoading] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);
    const [configError, setConfigError] = useState("");
    const [configSuccess, setConfigSuccess] = useState("");


    async function loadCampaigns() {
        try {
            const [campaignsData, statsData] = await Promise.all([
                apiGet<CampaignStats[]>("/finance/campaigns"),
                apiGet<GlobalStats>("/finance/stats"),
            ]);
            setCampaigns(campaignsData);
            setStats(statsData);
            try {
                const netData = await apiGet<{ children?: unknown[] }>("/associations/network");
                setHasChildren(Array.isArray(netData?.children) && netData.children.length > 0);
            } catch { /* no children */ }
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }

    async function loadTreasury() {
        setTreasuryLoading(true);
        try {
            const data = await apiGet<TreasuryAccount[]>("/finance/treasury-accounts");
            setAccounts(data);
            // Pre-select first account for expense form if empty
            if (data.length > 0 && !expForm.treasuryAccountId) {
                setExpForm(p => ({ ...p, treasuryAccountId: data[0].id }));
            }
        } catch { /* silent */ } finally {
            setTreasuryLoading(false);
        }
    }

    async function loadLedger() {
        setLedgerLoading(true);
        try {
            const data = await apiGet<LedgerData>("/finance/ledger");
            setLedger(data);
        } catch { /* silent */ } finally {
            setLedgerLoading(false);
        }
    }

    async function loadPaymentConfig() {
        setConfigLoading(true);
        try {
            const data = await apiGet<PaymentConfig>("/finance/config");
            setPaymentConfig(data);
        } catch { /* silent */ } finally {
            setConfigLoading(false);
        }
    }

    useEffect(() => {
        loadCampaigns();
        loadTreasury(); // Always load treasury to populate dropdowns
    }, []);

    useEffect(() => {
        if (activeTab === "ledger" && !ledger) loadLedger();
        if (activeTab === "expenses" && !ledger) loadLedger();
        if (activeTab === "treasury") loadTreasury();
        if (activeTab === "config") loadPaymentConfig();
    }, [activeTab]);

    // ── Campaign creation ──
    async function handleCreateCampaign(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);
        try {
            await apiPost("/finance/campaigns", {
                name: form.name,
                amount: parseFloat(form.amount),
                due_date: form.due_date,
                scope: form.scope,
                frequency: form.frequency,
            });
            setModalOpen(false);
            setForm({ name: "", amount: "", due_date: "", scope: "LOCAL", frequency: "ONETIME" });
            await loadCampaigns();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Erreur lors de la création.");
        } finally {
            setFormLoading(false);
        }
    }

    // ── Account creation ──
    async function handleCreateAccount(e: FormEvent) {
        e.preventDefault();
        setAccFormLoading(true);
        try {
            await apiPost("/finance/treasury-accounts", {
                name: accForm.name,
                type: accForm.type,
                initialBalance: parseFloat(accForm.initialBalance)
            });
            setAccModalOpen(false);
            setAccForm({ name: "", type: "CASH", initialBalance: "0" });
            await loadTreasury();
        } catch (err) {
            console.error(err);
        } finally {
            setAccFormLoading(false);
        }
    }

    // ── Expense creation ──
    async function handleCreateExpense(e: FormEvent) {
        e.preventDefault();
        setExpFormError("");
        setExpFormLoading(true);
        try {
            await apiPost("/finance/transactions/expense", {
                amount: parseFloat(expForm.amount),
                category: expForm.category,
                paymentMethod: expForm.paymentMethod,
                date: expForm.date,
                description: expForm.description || undefined,
                treasuryAccountId: expForm.treasuryAccountId || undefined
            });
            setExpModalOpen(false);
            setExpForm(p => ({
                amount: "",
                category: "AUTRE",
                paymentMethod: "CASH",
                date: new Date().toISOString().split("T")[0],
                description: "",
                treasuryAccountId: accounts.length > 0 ? accounts[0].id : ""
            }));
            // Reload ledger + stats + treasury
            await Promise.all([loadLedger(), loadCampaigns(), loadTreasury()]);
        } catch (err) {
            setExpFormError(err instanceof Error ? err.message : "Erreur lors de la saisie.");
        } finally {
            setExpFormLoading(false);
        }
    }

    // ── Save Payment Config ──
    async function handleSaveConfig(e: FormEvent) {
        e.preventDefault();
        setConfigSaving(true);
        setConfigError("");
        setConfigSuccess("");
        try {
            await apiPatch("/finance/config", paymentConfig as any);
            setConfigSuccess("Configuration sauvegardée avec succès.");
        } catch (err) {
            setConfigError(err instanceof Error ? err.message : "Erreur.");
        } finally {
            setConfigSaving(false);
        }
    }

    // ── CSV Export ──
    async function exportCSV() {
        if (!ledger) return;
        try {
            await apiGetBlob("/finance/ledger/export", `grand-livre-${new Date().toISOString().split("T")[0]}.csv`);
        } catch (error) {
            console.error("Export failed", error);
            alert("Erreur lors de l'export du Grand Livre");
        }
    }

    // KPI cards
    const kpis = [
        {
            label: "Total à collecter",
            value: formatCurrency(stats.totalExpected),
            icon: Target,
            color: "#3b82f6",
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            label: "Total encaissé",
            value: formatCurrency(stats.totalCollected),
            icon: TrendingUp,
            color: "#10b981",
            gradient: "from-emerald-500/20 to-emerald-600/5",
            border: "border-emerald-500/20",
        },
        {
            label: "Reste à percevoir",
            value: formatCurrency(stats.remaining),
            icon: TrendingDown,
            color: "#f59e0b",
            gradient: "from-amber-500/20 to-amber-600/5",
            border: "border-amber-500/20",
        },
    ];

    // Expense-only transactions from ledger
    const expenses = ledger?.transactions?.filter((t) => t.type === "EXPENSE") || [];

    return (
        <RequirePermission permissions={["finance.view"]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-400" />
                        Finances
                    </h2>
                </div>

                {/* KPI Cards (Hidden in Config tab) */}
                {activeTab !== "config" && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {kpis.map((kpi) => (
                            <div
                                key={kpi.label}
                                className={`relative overflow-hidden backdrop-blur-md bg-gradient-to-br ${kpi.gradient} border ${kpi.border} rounded-2xl p-5 shadow-lg`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            {kpi.label}
                                        </p>
                                        <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
                                            {kpi.value}
                                        </p>
                                    </div>
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${kpi.color}20` }}
                                    >
                                        <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                                    </div>
                                </div>
                                <div
                                    className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl"
                                    style={{ backgroundColor: kpi.color }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="flex gap-1 bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/10 overflow-x-auto">
                    {TABS.map((tab) => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${active
                                    ? "bg-white/10 text-white shadow-lg border border-white/10"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ════════ TAB 1: CAMPAIGNS ════════ */}
                {activeTab === "campaigns" && (
                    <>
                        <div className="flex justify-end">
                            <GlassButton
                                className="!w-auto px-5"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => setModalOpen(true)}
                            >
                                Lancer une campagne
                            </GlassButton>
                        </div>

                        <GlassCard className="!p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/10">
                                <h3 className="text-sm font-semibold text-white">Campagnes de cotisation</h3>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : campaigns.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">Aucune campagne pour le moment.</p>
                                    <p className="text-xs mt-1">Cliquez sur &quot;Lancer une campagne&quot; pour commencer.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Campagne</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Portée</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Montant</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Fréquence</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Échéance</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Cibles</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5 min-w-[200px]">Progression</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns.map((c) => {
                                                const isOverdue = new Date(c.due_date) < new Date() && c.progress < 100;
                                                const scopeInfo = SCOPE_LABELS[c.scope] || SCOPE_LABELS.LOCAL;
                                                return (
                                                    <tr
                                                        key={c.id}
                                                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                                                        onClick={() => router.push(`/dashboard/finance/${c.id}`)}
                                                    >
                                                        <td className="px-5 py-3.5">
                                                            <p className="text-white font-medium">{c.name}</p>
                                                            {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                                                                style={{
                                                                    backgroundColor: `${scopeInfo.color}15`,
                                                                    borderColor: `${scopeInfo.color}30`,
                                                                    color: scopeInfo.color,
                                                                }}
                                                            >
                                                                {scopeInfo.icon} {scopeInfo.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-white font-semibold">{formatCurrency(c.amount)}</td>
                                                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                                                            {c.frequency === 'ONETIME' ? 'Une fois' :
                                                                c.frequency === 'MONTHLY' ? 'Mensuelle' :
                                                                    c.frequency === 'QUARTERLY' ? 'Trimestrielle' :
                                                                        c.frequency === 'YEARLY' ? 'Annuelle' : '—'}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-red-400" : "text-gray-300"}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(c.due_date)}
                                                                {isOverdue && <Clock className="w-3 h-3 text-red-400" />}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                                                                {c.scope === "NETWORK_BRANCHES" ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                                                {c.paidMembers}/{c.totalMembers}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${c.progress}%`,
                                                                            background:
                                                                                c.progress === 100
                                                                                    ? "linear-gradient(90deg, #10b981, #34d399)"
                                                                                    : c.progress >= 50
                                                                                        ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                                                                                        : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className={`text-xs font-bold min-w-[3rem] text-right ${c.progress === 100 ? "text-emerald-400" : c.progress >= 50 ? "text-blue-400" : "text-amber-400"}`}>
                                                                    {c.progress}%
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {formatCurrency(c.totalCollected)} / {formatCurrency(c.totalExpected)}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </GlassCard>
                    </>
                )}

                {/* ════════ TAB: TREASURY ════════ */}
                {activeTab === "treasury" && (
                    <>
                        <div className="flex justify-end">
                            <GlassButton
                                className="!w-auto px-5"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => setAccModalOpen(true)}
                            >
                                Ajouter un compte
                            </GlassButton>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map((acc) => (
                                <GlassCard key={acc.id} className="relative overflow-hidden group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {acc.type === 'BANK' && <Building2 className="w-4 h-4 text-gray-400" />}
                                                {acc.type === 'MOBILE_MONEY' && <CreditCard className="w-4 h-4 text-gray-400" />}
                                                {acc.type === 'CASH' && <Wallet className="w-4 h-4 text-gray-400" />}
                                                {acc.type === 'OTHER' && <Wallet className="w-4 h-4 text-gray-400" />}
                                                <h3 className="text-sm font-medium text-gray-200">{acc.name}</h3>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{formatCurrency(acc.balance)}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-full opacity-50" />
                                    </div>
                                </GlassCard>
                            ))}
                            {accounts.length === 0 && !treasuryLoading && (
                                <div className="col-span-full py-12 text-center text-gray-400 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                    <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Aucun compte de trésorerie.</p>
                                    <p className="text-sm mt-1">Créez des comptes pour suivre votre argent (Caisse, Banque, Mobile Money...).</p>
                                </div>
                            )}
                        </div>
                    </>
                )}


                {/* ════════ TAB 2: EXPENSES ════════ */}
                {activeTab === "expenses" && (
                    <>
                        <div className="flex justify-end">
                            <GlassButton
                                className="!w-auto px-5"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => setExpModalOpen(true)}
                            >
                                Saisir une dépense
                            </GlassButton>
                        </div>

                        <GlassCard className="!p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/10">
                                <h3 className="text-sm font-semibold text-white">Dernières dépenses</h3>
                            </div>

                            {ledgerLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : expenses.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">Aucune dépense enregistrée.</p>
                                    <p className="text-xs mt-1">Cliquez sur &quot;Saisir une dépense&quot; pour commencer.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Date</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Catégorie</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Description</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Compte</th>
                                                <th className="text-right text-gray-400 font-medium px-5 py-3.5">Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenses.map((t) => (
                                                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                                    <td className="px-5 py-3.5 text-gray-300">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(t.date)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/20">
                                                            {CATEGORY_LABELS[t.category || ""] || t.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-white">{t.description || "—"}</td>
                                                    <td className="px-5 py-3.5 text-gray-400 text-xs">{t.treasuryAccount || "—"}</td>
                                                    <td className="px-5 py-3.5 text-right text-red-400 font-semibold">
                                                        -{formatCurrency(t.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </GlassCard>
                    </>
                )}

                {/* ════════ TAB 3: GRAND LIVRE ════════ */}
                {activeTab === "ledger" && (
                    <>
                        {/* Balance Card */}
                        {ledger && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    className={`relative overflow-hidden backdrop-blur-md rounded-2xl p-6 shadow-lg border ${ledger.currentBalance >= 0
                                        ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border-emerald-500/20"
                                        : "bg-gradient-to-br from-red-500/20 to-red-600/5 border-red-500/20"
                                        }`}
                                >
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                        Solde actuel
                                    </p>
                                    <p className={`text-3xl font-bold ${ledger.currentBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {formatCurrency(ledger.currentBalance)}
                                    </p>
                                    <div
                                        className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl"
                                        style={{ backgroundColor: ledger.currentBalance >= 0 ? "#10b981" : "#ef4444" }}
                                    />
                                </div>
                                <div className="backdrop-blur-md bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total recettes</p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(ledger.totalIncome)}</p>
                                </div>
                                <div className="backdrop-blur-md bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/15 rounded-2xl p-5 shadow-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowUpCircle className="w-4 h-4 text-red-400" />
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total dépenses</p>
                                    </div>
                                    <p className="text-xl font-bold text-red-400">{formatCurrency(ledger.totalExpense)}</p>
                                </div>
                            </div>
                        )}

                        {/* Ledger Actions */}
                        <div className="flex justify-end gap-3">
                            <GlassButton
                                className="!w-auto px-4"
                                icon={<Download className="w-4 h-4" />}
                                onClick={exportCSV}
                                disabled={!ledger || ledger.transactions.length === 0}
                            >
                                Exporter CSV
                            </GlassButton>
                        </div>

                        {/* Ledger Table */}
                        <GlassCard className="!p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/10">
                                <h3 className="text-sm font-semibold text-white">
                                    Journal des transactions
                                    {ledger && (
                                        <span className="text-gray-500 font-normal ml-2">
                                            ({ledger.transactions.length} écritures)
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {ledgerLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : !ledger || ledger.transactions.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">Aucune transaction enregistrée.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-mono">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                                <th className="text-left text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Date</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Type</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Catégorie</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Description</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Méthode</th>
                                                <th className="text-left text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Compte</th>
                                                <th className="text-right text-gray-400 font-medium px-5 py-3 text-xs uppercase tracking-wider">Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledger.transactions.map((t, idx) => {
                                                const isIncome = t.type === "INCOME";
                                                return (
                                                    <tr
                                                        key={t.id}
                                                        className={`border-b border-white/5 transition-colors ${idx % 2 === 0 ? "bg-white/[0.01]" : ""
                                                            }`}
                                                    >
                                                        <td className="px-5 py-2.5 text-gray-300 text-xs whitespace-nowrap">
                                                            {formatDate(t.date)}
                                                        </td>
                                                        <td className="px-5 py-2.5">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${isIncome
                                                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                                                                    : "bg-red-500/15 text-red-300 border-red-500/25"
                                                                    }`}
                                                            >
                                                                {isIncome ? (
                                                                    <ArrowDownCircle className="w-3 h-3" />
                                                                ) : (
                                                                    <ArrowUpCircle className="w-3 h-3" />
                                                                )}
                                                                {isIncome ? "Recette" : "Dépense"}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-2.5 text-gray-300 text-xs">
                                                            {CATEGORY_LABELS[t.category || ""] || t.category || "—"}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-white text-xs">
                                                            {t.description || "—"}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-gray-400 text-xs">
                                                            {t.paymentMethod || "—"}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-gray-400 text-xs">
                                                            {t.treasuryAccount || "—"}
                                                        </td>
                                                        <td className={`px-5 py-2.5 text-right font-semibold text-sm ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                                                            {isIncome ? "+" : "-"}
                                                            {formatCurrency(t.amount)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </GlassCard>
                    </>
                )}

                {/* ════════ TAB 4: CONFIGURATION ════════ */}
                {activeTab === "config" && (
                    <div className="max-w-2xl mx-auto">
                        <GlassCard className="p-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <CreditCard className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Configuration des Paiements</h3>
                                    <p className="text-sm text-gray-400">Gérez les moyens de paiement en ligne pour vos cotisations.</p>
                                </div>
                            </div>

                            {configLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <form onSubmit={handleSaveConfig} className="space-y-6">
                                    {configSuccess && (
                                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            {configSuccess}
                                        </div>
                                    )}
                                    {configError && (
                                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            {configError}
                                        </div>
                                    )}

                                    {/* Enable/Disable Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div>
                                            <p className="text-white font-medium">Activer le paiement en ligne</p>
                                            <p className="text-xs text-gray-400">Permettre aux membres de payer via l'application</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentConfig(p => ({ ...p, isEnabled: !p.isEnabled }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${paymentConfig.isEnabled ? "bg-emerald-500" : "bg-gray-700"}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${paymentConfig.isEnabled ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>

                                    {/* Provider Select */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Fournisseur de paiement</label>
                                        <div className="relative">
                                            <select
                                                value={paymentConfig.provider}
                                                onChange={(e) => setPaymentConfig(p => ({ ...p, provider: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                                            >
                                                {PAYMENT_PROVIDERS.map(p => (
                                                    <option key={p.value} value={p.value} className="bg-gray-900">{p.label}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* API Keys (Only if not MANUAL) */}
                                    {paymentConfig.provider !== "MANUAL" && (
                                        <div className="space-y-4 pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                            <GlassInput
                                                label="Clé Publique (Public Key)"
                                                placeholder="pk_test_..."
                                                value={paymentConfig.publicKey || ""}
                                                onChange={(e) => setPaymentConfig(p => ({ ...p, publicKey: e.target.value }))}
                                            />
                                            <GlassInput
                                                label="Clé Secrète (Secret Key)"
                                                type="password"
                                                placeholder="sk_test_..."
                                                value={paymentConfig.secretKey || ""}
                                                onChange={(e) => setPaymentConfig(p => ({ ...p, secretKey: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    <div className="pt-2 flex justify-end">
                                        <GlassButton
                                            type="submit"
                                            isLoading={configSaving}
                                            icon={<CheckCircle className="w-4 h-4" />}
                                            className="bg-blue-600 hover:bg-blue-500"
                                        >
                                            Enregistrer la configuration
                                        </GlassButton>
                                    </div>
                                </form>
                            )}
                        </GlassCard>
                    </div>
                )}

                {/* ── Campaign Creation Modal ── */}
                <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} title="Lancer une campagne de cotisation">
                    <form onSubmit={handleCreateCampaign} className="space-y-4">
                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{formError}</div>
                        )}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                            <p className="text-xs text-blue-300">
                                <strong>💡 Moteur automatique :</strong>{" "}
                                {form.scope === "NETWORK_BRANCHES"
                                    ? "Une dette sera créée pour chaque antenne fille de votre association."
                                    : form.scope === "NETWORK_MEMBERS"
                                        ? "Une dette sera créée pour chaque membre actif de votre réseau (siège + antennes)."
                                        : "Une dette sera créée pour chaque membre actif de votre association."}
                            </p>
                        </div>
                        <GlassInput label="Nom de la campagne" placeholder="Ex: Adhésion 2026" icon={<Wallet className="w-4 h-4" />} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />

                        {/* Frequency Select */}
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Fréquence de cotisation</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Clock className="w-4 h-4" /></div>
                                <select
                                    value={form.frequency}
                                    onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    <option value="ONETIME" className="bg-gray-900 text-white">Une seule fois</option>
                                    <option value="MONTHLY" className="bg-gray-900 text-white">Mensuelle</option>
                                    <option value="QUARTERLY" className="bg-gray-900 text-white">Trimestrielle</option>
                                    <option value="YEARLY" className="bg-gray-900 text-white">Annuelle</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Portée de la campagne</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Network className="w-4 h-4" /></div>
                                <select
                                    id="scope-select"
                                    value={form.scope}
                                    onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    <option value="LOCAL" className="bg-gray-900 text-white">👤 Local — Membres de mon association</option>
                                    {hasChildren && (
                                        <>
                                            <option value="NETWORK_MEMBERS" className="bg-gray-900 text-white">👥 Réseau (Membres) — Tous les membres</option>
                                            <option value="NETWORK_BRANCHES" className="bg-gray-900 text-white">🏢 Réseau (Antennes) — Facturer les antennes</option>
                                        </>
                                    )}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>
                        <GlassInput label="Montant unitaire" type="number" placeholder="5000" icon={<TrendingUp className="w-4 h-4" />} value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
                        <GlassInput label="Date limite (1er échéance si récurrent)" type="date" icon={<Calendar className="w-4 h-4" />} value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required />
                        <div className="pt-2">
                            <GlassButton type="submit" isLoading={formLoading} icon={<Plus className="w-4 h-4" />}>Lancer la campagne</GlassButton>
                        </div>
                    </form>
                </GlassModal>

                {/* ── Treasury Account Modal ── */}
                <GlassModal open={accModalOpen} onClose={() => setAccModalOpen(false)} title="Ajouter un compte de trésorerie">
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <GlassInput
                            label="Nom du compte"
                            placeholder="Ex: Caisse Principale, UBA Bank"
                            icon={<Landmark className="w-4 h-4" />}
                            value={accForm.name}
                            onChange={(e) => setAccForm((p) => ({ ...p, name: e.target.value }))}
                            required
                        />

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Type de compte</label>
                            <div className="relative">
                                <select
                                    value={accForm.type}
                                    onChange={(e) => setAccForm((p) => ({ ...p, type: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    {ACCOUNT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value} className="bg-gray-900 text-white">
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>

                        <GlassInput
                            label="Solde initial (à la création)"
                            type="number"
                            placeholder="0"
                            icon={<TrendingUp className="w-4 h-4" />}
                            value={accForm.initialBalance}
                            onChange={(e) => setAccForm((p) => ({ ...p, initialBalance: e.target.value }))}
                            required
                        />

                        <div className="pt-2">
                            <GlassButton type="submit" isLoading={accFormLoading} icon={<Plus className="w-4 h-4" />}>
                                Créer le compte
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>

                {/* ── Expense Creation Modal ── */}
                <GlassModal open={expModalOpen} onClose={() => setExpModalOpen(false)} title="Saisir une dépense">
                    <form onSubmit={handleCreateExpense} className="space-y-4">
                        {expFormError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{expFormError}</div>
                        )}

                        <GlassInput
                            label="Montant"
                            type="number"
                            placeholder="15000"
                            icon={<CreditCard className="w-4 h-4" />}
                            value={expForm.amount}
                            onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))}
                            required
                        />

                        {/* Treasury Account Select */}
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Débiter le compte</label>
                            <div className="relative">
                                <select
                                    value={expForm.treasuryAccountId}
                                    onChange={(e) => setExpForm((p) => ({ ...p, treasuryAccountId: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    <option value="" className="bg-gray-900 text-gray-400">-- Aucun (Transaction simple) --</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id} className="bg-gray-900 text-white">
                                            {acc.name} ({formatCurrency(acc.balance)})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>

                        {/* Category select */}
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Catégorie</label>
                            <div className="relative">
                                <select
                                    value={expForm.category}
                                    onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    {EXPENSE_CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value} className="bg-gray-900 text-white">
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>

                        {/* Payment method select */}
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Méthode de paiement</label>
                            <div className="relative">
                                <select
                                    value={expForm.paymentMethod}
                                    onChange={(e) => setExpForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    {PAYMENT_METHODS.map((m) => (
                                        <option key={m.value} value={m.value} className="bg-gray-900 text-white">
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>

                        <GlassInput
                            label="Date"
                            type="date"
                            icon={<Calendar className="w-4 h-4" />}
                            value={expForm.date}
                            onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))}
                            required
                        />

                        <GlassInput
                            label="Description"
                            placeholder="Ex: Achat de fournitures de bureau"
                            icon={<Receipt className="w-4 h-4" />}
                            value={expForm.description}
                            onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
                        />

                        <div className="pt-2">
                            <GlassButton type="submit" isLoading={expFormLoading} icon={<Plus className="w-4 h-4" />}>
                                Enregistrer la dépense
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}
