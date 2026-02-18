"use client";

import { useEffect, useState, useRef } from "react";
import {
    FileText,
    Upload,
    Download,
    Search,
    FolderOpen,
    ChevronRight,
    Trash2,
    CalendarDays,
    Filter,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, API_URL, BASE_URL } from "@/lib/api";

/* ─── Types ─── */
interface DocItem {
    id: string;
    name: string;
    file_url: string;
    category: string;
    access_level: string;
    createdAt: string;
    event?: { id: string; title: string } | null;
}

const CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
    ALL: { label: "Tous", icon: "📂", color: "#6b7280" },
    STATUTES: { label: "Statuts", icon: "📜", color: "#8b5cf6" },
    MEETING_MINUTES: { label: "PV de réunion", icon: "📝", color: "#3b82f6" },
    INVOICE: { label: "Factures", icon: "🧾", color: "#f59e0b" },
    ADMINISTRATIVE: { label: "Administratif", icon: "📋", color: "#10b981" },
    OTHER: { label: "Autre", icon: "📁", color: "#6b7280" },
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getFileIcon(name: string): string {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "📄";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["zip", "rar"].includes(ext)) return "📦";
    return "📎";
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState("OTHER");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function loadDocs() {
        try {
            const data = await apiGet<DocItem[]>("/documents");
            setDocuments(data);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadDocs(); }, []);

    async function handleUpload() {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;
        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", uploadCategory);

            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/documents/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            setUploadOpen(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            await loadDocs();
        } catch { /* silent */ } finally {
            setUploadLoading(false);
        }
    }

    async function handleDelete(docId: string) {
        if (!confirm("Supprimer ce document ?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/documents/${docId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            await loadDocs();
        } catch { /* silent */ }
    }

    // Filter + search
    const filtered = documents.filter((d) => {
        const matchCat = filter === "ALL" || d.category === filter;
        const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    // Category counts
    const catCounts: Record<string, number> = { ALL: documents.length };
    documents.forEach((d) => { catCounts[d.category] = (catCounts[d.category] || 0) + 1; });

    return (
        <RequirePermission permissions={["events.view"]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-amber-400" />
                        Coffre-fort numérique
                    </h2>
                    <GlassButton className="!w-auto px-5" icon={<Upload className="w-4 h-4" />} onClick={() => setUploadOpen(true)}>
                        Ajouter un document
                    </GlassButton>
                </div>

                {/* ── Category Filters ── */}
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(CATEGORIES).map(([key, cat]) => {
                        const active = filter === key;
                        const count = catCounts[key] || 0;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${active ? "bg-white/10 text-white border-white/20" : "bg-white/[0.03] text-gray-400 border-white/5 hover:bg-white/[0.06] hover:text-white"}`}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${active ? "bg-white/10" : "bg-white/5"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Search ── */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher un document..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                </div>

                {/* ── Document List ── */}
                <GlassCard className="!p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-white">
                            Documents
                            <span className="text-gray-500 font-normal ml-2">({filtered.length})</span>
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">{search || filter !== "ALL" ? "Aucun document trouvé." : "Aucun document enregistré."}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filtered.map((doc) => {
                                const catInfo = CATEGORIES[doc.category] || CATEGORIES.OTHER;
                                return (
                                    <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors group">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                            style={{ backgroundColor: `${catInfo.color}15` }}
                                        >
                                            {getFileIcon(doc.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                                                    style={{ backgroundColor: `${catInfo.color}10`, borderColor: `${catInfo.color}25`, color: catInfo.color }}
                                                >
                                                    {catInfo.label}
                                                </span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <CalendarDays className="w-2.5 h-2.5" />
                                                    {formatDate(doc.createdAt)}
                                                </span>
                                                {doc.event && (
                                                    <span className="text-[10px] text-blue-400">
                                                        🔗 {doc.event.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={`${BASE_URL}${doc.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                title="Télécharger"
                                            >
                                                <Download className="w-4 h-4 text-gray-400 hover:text-white" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>

                {/* ── Upload Modal ── */}
                <GlassModal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Ajouter un document">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Catégorie</label>
                            <div className="relative">
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                                    style={{ WebkitAppearance: "none" }}
                                >
                                    <option value="STATUTES" className="bg-gray-900 text-white">📜 Statuts</option>
                                    <option value="MEETING_MINUTES" className="bg-gray-900 text-white">📝 PV de réunion</option>
                                    <option value="INVOICE" className="bg-gray-900 text-white">🧾 Facture</option>
                                    <option value="ADMINISTRATIVE" className="bg-gray-900 text-white">📋 Administratif</option>
                                    <option value="OTHER" className="bg-gray-900 text-white">📁 Autre</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Fichier</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 file:cursor-pointer cursor-pointer"
                            />
                        </div>
                        <GlassButton onClick={handleUpload} isLoading={uploadLoading} icon={<Upload className="w-4 h-4" />}>
                            Envoyer le document
                        </GlassButton>
                    </div>
                </GlassModal>
            </div>
        </RequirePermission>
    );
}
