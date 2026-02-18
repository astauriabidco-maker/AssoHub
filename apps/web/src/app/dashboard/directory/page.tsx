"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    BookOpen,
    Search,
    Briefcase,
    GraduationCap,
    Heart,
    BarChart3,
    Users,
    Download,
    ChevronLeft,
    ChevronRight,
    Award,
    TrendingUp,
    AlertCircle,
} from "lucide-react";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, API_URL } from "@/lib/api";

import MemberCard from "@/components/directory/MemberCard";
import StatCard from "@/components/directory/StatCard";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import ProfileEditorModal from "@/components/directory/ProfileEditorModal";
import {
    DirectoryMember,
    PaginatedResult,
    DirectoryStats,
    SECTOR_LABELS,
    EDUCATION_LABELS,
    PRO_STATUS_LABELS,
    SKILL_CATEGORY_COLORS,
    CHART_COLORS,
} from "@/components/directory/constants";

export default function DirectoryPage() {
    const [activeTab, setActiveTab] = useState<"search" | "mentors" | "dashboard">("search");
    const [loading, setLoading] = useState(true);

    // Search state
    const [members, setMembers] = useState<DirectoryMember[]>([]);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    const [search, setSearch] = useState("");
    const [filterSector, setFilterSector] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterEducation, setFilterEducation] = useState("");
    const [filterMentoring, setFilterMentoring] = useState("");
    const [filterCity, setFilterCity] = useState("");
    const [filterSkill, setFilterSkill] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Mentors
    const [mentors, setMentors] = useState<DirectoryMember[]>([]);
    const [mentorTotal, setMentorTotal] = useState(0);
    const [mentorPages, setMentorPages] = useState(1);
    const [mentorPage, setMentorPage] = useState(1);

    // Dashboard
    const [stats, setStats] = useState<DirectoryStats | null>(null);

    // Profile editor
    const [editMember, setEditMember] = useState<DirectoryMember | null>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

    function showToast(message: string, type: "error" | "success" = "error") {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }

    // ── Load tab data ──
    const loadSearchData = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filterSector) params.set("industrySector", filterSector);
            if (filterStatus) params.set("professionalStatus", filterStatus);
            if (filterEducation) params.set("educationLevel", filterEducation);
            if (filterMentoring) params.set("availableForMentoring", filterMentoring);
            if (filterCity) params.set("city", filterCity);
            if (filterSkill) params.set("skillName", filterSkill);
            params.set("page", String(p));
            params.set("limit", "12");
            const data = await apiGet(`/directory?${params.toString()}`) as PaginatedResult<DirectoryMember>;
            setMembers(data.data);
            setTotalMembers(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } catch {
            showToast("Erreur lors du chargement de l'annuaire.");
        } finally {
            setLoading(false);
        }
    }, [search, filterSector, filterStatus, filterEducation, filterMentoring, filterCity, filterSkill]);

    const loadMentorsData = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await apiGet(`/directory/mentors?page=${p}&limit=12`) as PaginatedResult<DirectoryMember>;
            setMentors(data.data);
            setMentorTotal(data.total);
            setMentorPages(data.totalPages);
            setMentorPage(data.page);
        } catch {
            showToast("Erreur lors du chargement des mentors.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStatsData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet("/directory/stats") as DirectoryStats;
            setStats(data);
        } catch {
            showToast("Erreur lors du chargement des statistiques.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "search") loadSearchData(1);
        else if (activeTab === "mentors") loadMentorsData(1);
        else loadStatsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Debounced search when filters change
    useEffect(() => {
        if (activeTab !== "search") return;
        const timer = setTimeout(() => {
            setPage(1);
            loadSearchData(1);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filterSector, filterStatus, filterEducation, filterMentoring, filterCity, filterSkill]);

    const activeFilterCount = useMemo(() =>
        [filterSector, filterStatus, filterEducation, filterMentoring, filterCity, filterSkill].filter(Boolean).length,
        [filterSector, filterStatus, filterEducation, filterMentoring, filterCity, filterSkill]
    );

    function resetFilters() {
        setFilterSector(""); setFilterStatus(""); setFilterEducation("");
        setFilterMentoring(""); setFilterCity(""); setFilterSkill("");
    }

    // ── Export CSV ──
    async function handleExportCsv() {
        try {
            const params = new URLSearchParams();
            if (filterSector) params.set("industrySector", filterSector);
            if (filterStatus) params.set("professionalStatus", filterStatus);
            if (filterEducation) params.set("educationLevel", filterEducation);
            if (filterMentoring) params.set("availableForMentoring", filterMentoring);

            const token = localStorage.getItem("token");
            const resp = await fetch(
                `${API_URL}/directory/export?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!resp.ok) throw new Error("Export failed");
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `annuaire_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Export CSV téléchargé !", "success");
        } catch {
            showToast("Erreur lors de l'export CSV.");
        }
    }

    const tabs = [
        { key: "search" as const, label: "Annuaire", icon: Search },
        { key: "mentors" as const, label: "Mentors", icon: Heart },
        { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    ];

    return (
        <RequirePermission permissions={["members.view"]}>
            <div className="space-y-6">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 backdrop-blur-md border text-sm px-5 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top duration-300 ${toast.type === "error"
                        ? "bg-red-500/20 border-red-500/30 text-red-300"
                        : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        }`}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {toast.message}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                        Annuaire des Compétences
                    </h2>
                    <button onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07] text-sm font-medium transition-colors cursor-pointer">
                        <Download className="w-4 h-4" />
                        Exporter CSV
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                    {tabs.map((t) => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === t.key
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}>
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* ── TAB: Search ── */}
                {!loading && activeTab === "search" && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input type="text" placeholder="Rechercher par nom, métier, employeur…" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all hover:bg-white/[0.07]" />
                            </div>
                            <DirectoryFilters
                                show={showFilters} onToggle={() => setShowFilters(!showFilters)}
                                filterSector={filterSector} setFilterSector={setFilterSector}
                                filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                                filterEducation={filterEducation} setFilterEducation={setFilterEducation}
                                filterMentoring={filterMentoring} setFilterMentoring={setFilterMentoring}
                                filterCity={filterCity} setFilterCity={setFilterCity}
                                filterSkill={filterSkill} setFilterSkill={setFilterSkill}
                                activeFilterCount={activeFilterCount} onReset={resetFilters}
                            />
                        </div>

                        <p className="text-sm text-gray-400">
                            {totalMembers} membre{totalMembers !== 1 ? "s" : ""} trouvé{totalMembers !== 1 ? "s" : ""}
                        </p>

                        {members.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Aucun résultat pour ces critères.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {members.map((m) => (
                                    <MemberCard key={m.id} member={m} onEdit={() => setEditMember(m)} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => loadSearchData(p)} />
                        )}
                    </div>
                )}

                {/* ── TAB: Mentors ── */}
                {!loading && activeTab === "mentors" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <Heart className="w-5 h-5 text-amber-400 shrink-0" />
                            <p className="text-sm text-amber-200">
                                Ces membres se sont déclarés disponibles pour accompagner et guider les jeunes ou d&apos;autres membres.
                            </p>
                        </div>

                        {mentors.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Aucun mentor disponible pour le moment.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mentors.map((m) => (
                                    <MemberCard key={m.id} member={m} onEdit={() => setEditMember(m)} isMentor />
                                ))}
                            </div>
                        )}

                        {mentorPages > 1 && (
                            <Pagination page={mentorPage} totalPages={mentorPages} onPageChange={(p) => loadMentorsData(p)} />
                        )}
                    </div>
                )}

                {/* ── TAB: Dashboard ── */}
                {!loading && activeTab === "dashboard" && stats && (
                    <div className="space-y-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Membres actifs" value={stats.totalActive} icon={Users} color="indigo" />
                            <StatCard label="Profils complétés" value={`${stats.profileCompletionRate}%`} icon={TrendingUp} color="emerald" />
                            <StatCard label="Mentors disponibles" value={stats.totalMentors} icon={Heart} color="amber" />
                            <StatCard label="Compétences recensées" value={stats.topSkills.length} icon={Award} color="purple" />
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <DistributionChart title="Répartition par secteur" icon={<Briefcase className="w-4 h-4 text-indigo-400" />}
                                data={stats.sectorDistribution} labels={SECTOR_LABELS} colorOffset={0} />
                            <DistributionChart title="Niveau d'études" icon={<GraduationCap className="w-4 h-4 text-emerald-400" />}
                                data={stats.educationDistribution} labels={EDUCATION_LABELS} colorOffset={4} />
                            <DistributionChart title="Situation professionnelle" icon={<Briefcase className="w-4 h-4 text-pink-400" />}
                                data={stats.statusDistribution} labels={PRO_STATUS_LABELS} colorOffset={7} />

                            {/* Top skills */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    Top compétences
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {stats.topSkills.map((s) => (
                                        <span key={s.name}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${SKILL_CATEGORY_COLORS[s.category || "OTHER"]}`}>
                                            {s.name}
                                            <span className="text-[10px] opacity-60">({s.memberCount})</span>
                                        </span>
                                    ))}
                                    {stats.topSkills.length === 0 && (
                                        <p className="text-xs text-gray-500 italic">Aucune compétence enregistrée.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile editor modal */}
                <ProfileEditorModal
                    member={editMember}
                    onClose={() => setEditMember(null)}
                    onSaved={() => {
                        showToast("Profil mis à jour !", "success");
                        if (activeTab === "search") loadSearchData(page);
                        else if (activeTab === "mentors") loadMentorsData(mentorPage);
                    }}
                    onError={(msg) => showToast(msg)}
                />
            </div>
        </RequirePermission>
    );
}

/* ─── Pagination component ─── */
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/[0.07] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
                Précédent
            </button>
            <span className="text-sm text-gray-400">
                Page <span className="text-white font-medium">{page}</span> sur <span className="text-white font-medium">{totalPages}</span>
            </span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/[0.07] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                Suivant
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

/* ─── Distribution chart ─── */
function DistributionChart({ title, icon, data, labels, colorOffset }: {
    title: string; icon: React.ReactNode; data: Record<string, number>;
    labels: Record<string, string>; colorOffset: number;
}) {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? Math.max(...entries.map(([, v]) => v)) : 0;

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="space-y-2">
                {entries.map(([key, count], i) => {
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-28 truncate">{labels[key] || key}</span>
                            <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[(i + colorOffset) % CHART_COLORS.length] }} />
                            </div>
                            <span className="text-xs text-white font-medium w-6 text-right">{count}</span>
                        </div>
                    );
                })}
                {entries.length === 0 && <p className="text-xs text-gray-500 italic">Aucune donnée.</p>}
            </div>
        </div>
    );
}
