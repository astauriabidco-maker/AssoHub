"use client";

import React, { useEffect, useState } from "react";
import {
    FileText,
    Search,
    Filter,
    Plus,
    Download,
    Trash2,
    MoreVertical,
    File,
    FileCode,
    FileArchive,
    Loader2,
    CloudUpload
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Document {
    id: string;
    name: string;
    category: string;
    file_path: string;
    createdAt: string;
    event?: {
        title: string;
    };
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            const data = await apiFetch("/documents");
            setDocuments(data);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === "ALL" || doc.category === filter;
        return matchesSearch && matchesFilter;
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("category", "OTHER");

        try {
            const token = localStorage.getItem("assohub_token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/documents/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (!response.ok) throw new Error("Upload failed");
            fetchData();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Erreur lors de l'upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce document ?")) return;
        try {
            await apiFetch(`/documents/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Documents</h1>
                    <p className="text-white/60 mt-1">Gestion Électronique des Documents (GED)</p>
                </div>
                <label className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer">
                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <CloudUpload size={20} />}
                    {uploading ? "Envoi..." : "Ajouter un document"}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
            </div>

            <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center border-white/5 bg-white/5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un document..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-white/20" />
                    <select
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="ALL text-black">Toutes catégories</option>
                        <option value="AG_REPORT text-black">Procès-verbaux</option>
                        <option value="STATUTS text-black">Statuts</option>
                        <option value="INVOICE text-black">Factures</option>
                        <option value="OTHER text-black">Autres</option>
                    </select>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <GlassCard key={i} className="p-4 space-y-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </GlassCard>
                    ))
                ) : filteredDocs.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <FileText size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40 italic">Aucun document trouvé.</p>
                    </div>
                ) : (
                    filteredDocs.map((doc) => (
                        <GlassCard key={doc.id} className="p-4 group flex flex-col hover:border-primary/30 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary transition-transform group-hover:scale-110">
                                    <FileText size={20} />
                                </div>
                                <div className="flex gap-1">
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${doc.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-white/20 hover:text-white transition-colors"
                                    >
                                        <Download size={16} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-2 text-white/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors" title={doc.name}>
                                {doc.name}
                            </h3>
                            <div className="mt-auto pt-4 flex items-center justify-between">
                                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-white/10 text-white/30">
                                    {doc.category.replace('_', ' ')}
                                </Badge>
                                <span className="text-[10px] text-white/20">
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {doc.event && (
                                <div className="mt-2 text-[10px] text-primary/50 flex items-center gap-1">
                                    <File className="w-2.5 h-2.5" />
                                    <span className="truncate">{doc.event.title}</span>
                                </div>
                            )}
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
