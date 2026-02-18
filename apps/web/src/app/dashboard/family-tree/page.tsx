"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
    inferRelations,
    getInferredRelationsFor,
    suggestMissingLinks,
    computeTreeStats,
    type TreeMember,
    type TreeLink,
    type InferredRelation,
    type LinkSuggestion,
    type TreeStats,
} from "@/lib/tree-intelligence";
import {
    ZoomIn, ZoomOut, RotateCcw,
    Trash2, User as UserIcon, Link2, X, Search,
    BarChart3, Lightbulb, Brain, ChevronDown, ChevronUp,
    AlertTriangle, Info, AlertCircle, Check, GitBranch,
    Users, Heart, ArrowRight
} from "lucide-react";

// ─── Types ───────────────────────────────────────
interface TreeData {
    members: TreeMember[];
    links: TreeLink[];
}

// ─── Helpers ─────────────────────────────────────
const fullName = (m: TreeMember) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;

const initials = (m: TreeMember) =>
    (m.firstName?.[0] || "") + (m.lastName?.[0] || m.email[0] || "");

const GENDER_COLORS = {
    MALE: { bg: "#3b82f6", border: "#60a5fa", gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
    FEMALE: { bg: "#ec4899", border: "#f472b6", gradient: "linear-gradient(135deg, #ec4899, #be185d)" },
    OTHER: { bg: "#8b5cf6", border: "#a78bfa", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
    DEFAULT: { bg: "#6b7280", border: "#9ca3af", gradient: "linear-gradient(135deg, #6b7280, #4b5563)" },
};

function getGenderStyle(gender: string | null) {
    return GENDER_COLORS[gender as keyof typeof GENDER_COLORS] || GENDER_COLORS.DEFAULT;
}

const RELATION_ICONS: Record<string, string> = {
    SIBLING: "👫",
    GRANDPARENT: "👴",
    GRANDCHILD: "👶",
    UNCLE_AUNT: "🧑‍🦱",
    NEPHEW_NIECE: "🧒",
    COUSIN: "🤝",
};

const SUGGESTION_STYLES: Record<string, { icon: typeof Info; color: string; bgColor: string }> = {
    info: { icon: Info, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
    warning: { icon: AlertTriangle, color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
    error: { icon: AlertCircle, color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
};

// ─── Tree Layout Algorithm ───────────────────────
interface LayoutNode {
    member: TreeMember;
    x: number;
    y: number;
    generation: number;
    spouseId: string | null;
}

function computeLayout(members: TreeMember[], links: TreeLink[]) {
    if (members.length === 0) return { nodes: [], edges: links };

    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();
    const spouseMap = new Map<string, string>();

    for (const link of links) {
        if (link.relationType === "PARENT") {
            const children = childrenMap.get(link.fromUserId) || [];
            children.push(link.toUserId);
            childrenMap.set(link.fromUserId, children);
            const parents = parentsMap.get(link.toUserId) || [];
            parents.push(link.fromUserId);
            parentsMap.set(link.toUserId, parents);
        } else if (link.relationType === "SPOUSE") {
            spouseMap.set(link.fromUserId, link.toUserId);
            spouseMap.set(link.toUserId, link.fromUserId);
        }
    }

    const roots = members.filter(m => !(parentsMap.get(m.id)?.length));
    const generationMap = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { id: string; gen: number }[] = [];

    for (const root of roots) {
        if (!visited.has(root.id)) {
            queue.push({ id: root.id, gen: 0 });
            visited.add(root.id);
            const spouseId = spouseMap.get(root.id);
            if (spouseId && !visited.has(spouseId)) {
                queue.push({ id: spouseId, gen: 0 });
                visited.add(spouseId);
            }
        }
    }

    while (queue.length > 0) {
        const { id, gen } = queue.shift()!;
        generationMap.set(id, gen);
        const children = childrenMap.get(id) || [];
        for (const childId of children) {
            if (!visited.has(childId)) {
                visited.add(childId);
                queue.push({ id: childId, gen: gen + 1 });
                const childSpouse = spouseMap.get(childId);
                if (childSpouse && !visited.has(childSpouse)) {
                    visited.add(childSpouse);
                    queue.push({ id: childSpouse, gen: gen + 1 });
                }
            }
        }
    }

    for (const m of members) {
        if (!generationMap.has(m.id)) generationMap.set(m.id, 0);
    }

    const generations = new Map<number, TreeMember[]>();
    for (const m of members) {
        const gen = generationMap.get(m.id) || 0;
        const list = generations.get(gen) || [];
        list.push(m);
        generations.set(gen, list);
    }

    const NODE_W = 160;
    const NODE_H = 200;
    const COUPLE_GAP = 20;
    const SIBLING_GAP = 40;

    const nodes: LayoutNode[] = [];
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b);

    for (const gen of sortedGens) {
        const genMembers = generations.get(gen)!;
        let xOffset = 0;
        const placed = new Set<string>();

        for (const m of genMembers) {
            if (placed.has(m.id)) continue;
            const spouse = spouseMap.get(m.id);
            if (spouse && genMembers.find(gm => gm.id === spouse) && !placed.has(spouse)) {
                nodes.push({ member: m, x: xOffset, y: gen * NODE_H, generation: gen, spouseId: spouse });
                placed.add(m.id);
                const spouseMember = genMembers.find(gm => gm.id === spouse)!;
                nodes.push({ member: spouseMember, x: xOffset + NODE_W + COUPLE_GAP, y: gen * NODE_H, generation: gen, spouseId: m.id });
                placed.add(spouse);
                xOffset += (NODE_W + COUPLE_GAP) + NODE_W + SIBLING_GAP;
            } else {
                nodes.push({ member: m, x: xOffset, y: gen * NODE_H, generation: gen, spouseId: spouse || null });
                placed.add(m.id);
                xOffset += NODE_W + SIBLING_GAP;
            }
        }
    }

    const genWidths = new Map<number, { min: number; max: number }>();
    for (const node of nodes) {
        const curr = genWidths.get(node.generation) || { min: Infinity, max: -Infinity };
        curr.min = Math.min(curr.min, node.x);
        curr.max = Math.max(curr.max, node.x + NODE_W);
        genWidths.set(node.generation, curr);
    }

    const maxWidth = Math.max(...Array.from(genWidths.values()).map(w => w.max - w.min));
    for (const node of nodes) {
        const gw = genWidths.get(node.generation)!;
        const genWidth = gw.max - gw.min;
        const offset = (maxWidth - genWidth) / 2;
        node.x += offset - gw.min;
    }

    return { nodes, edges: links };
}

// ═══════════════════════════════════════════════════
// STATS PANEL COMPONENT
// ═══════════════════════════════════════════════════
function StatsPanel({ stats, isOpen, toggle }: { stats: TreeStats; isOpen: boolean; toggle: () => void }) {
    return (
        <div className="border-b border-white/10 bg-gradient-to-r from-blue-950/30 to-purple-950/30">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">Statistiques de l&apos;arbre</span>
                    {!isOpen && (
                        <div className="flex items-center gap-3 ml-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                                {stats.generations} gén. · {stats.totalMembers} membres · {stats.inferredRelationsCount} liens déduits
                            </span>
                        </div>
                    )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard icon="👥" label="Membres" value={stats.totalMembers} sub={`${stats.realMembers} réels · ${stats.virtualMembers} ancêtres`} />
                    <StatCard icon="🔗" label="Liens" value={stats.totalLinks} sub={`${stats.parentLinks} parenté · ${stats.spouseLinks} couple`} />
                    <StatCard icon="📊" label="Générations" value={stats.generations} sub="Profondeur de l'arbre" color="text-emerald-400" />
                    <StatCard icon="👶" label="Enfants/parent" value={stats.averageSiblings} sub="Moyenne par parent" />
                    <StatCard icon="🧠" label="Liens déduits" value={stats.inferredRelationsCount} sub="Relations inférées" color="text-purple-400" />
                    <StatCard
                        icon="⚠️"
                        label="Suggestions"
                        value={stats.suggestionsCount}
                        sub={stats.orphanCount > 0 ? `${stats.orphanCount} orphelin(s)` : "Aucun problème"}
                        color={stats.suggestionsCount > 0 ? "text-yellow-400" : "text-emerald-400"}
                    />

                    {/* Gender distribution bar */}
                    <div className="col-span-2 bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-2">Répartition genre</p>
                        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                            {stats.genderDistribution.male > 0 && (
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(stats.genderDistribution.male / stats.totalMembers) * 100}%`,
                                        background: GENDER_COLORS.MALE.gradient,
                                    }}
                                />
                            )}
                            {stats.genderDistribution.female > 0 && (
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(stats.genderDistribution.female / stats.totalMembers) * 100}%`,
                                        background: GENDER_COLORS.FEMALE.gradient,
                                    }}
                                />
                            )}
                            {(stats.genderDistribution.other + stats.genderDistribution.unknown) > 0 && (
                                <div
                                    className="h-full rounded-full bg-gray-600 transition-all"
                                    style={{
                                        width: `${((stats.genderDistribution.other + stats.genderDistribution.unknown) / stats.totalMembers) * 100}%`,
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex gap-3 mt-1.5">
                            <span className="text-[10px] text-blue-400">♂ {stats.genderDistribution.male}</span>
                            <span className="text-[10px] text-pink-400">♀ {stats.genderDistribution.female}</span>
                            <span className="text-[10px] text-gray-400">? {stats.genderDistribution.other + stats.genderDistribution.unknown}</span>
                        </div>
                    </div>

                    {/* Largest branch */}
                    {stats.largestBranch && (
                        <div className="col-span-2 bg-white/5 rounded-xl p-3 border border-white/5">
                            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Branche la plus large</p>
                            <p className="text-sm font-bold text-white">{stats.largestBranch.name}</p>
                            <p className="text-[10px] text-gray-500">{stats.largestBranch.count} membres</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number; sub: string; color?: string }) {
    return (
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color || "text-white"}`}>{value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// SUGGESTIONS BANNER
// ═══════════════════════════════════════════════════
function SuggestionsBanner({
    suggestions,
    isOpen,
    toggle,
    onApply,
    memberMap,
}: {
    suggestions: LinkSuggestion[];
    isOpen: boolean;
    toggle: () => void;
    onApply: (suggestion: LinkSuggestion) => void;
    memberMap: Map<string, TreeMember>;
}) {
    if (suggestions.length === 0) return null;

    const errorCount = suggestions.filter(s => s.severity === "error").length;
    const warningCount = suggestions.filter(s => s.severity === "warning").length;
    const infoCount = suggestions.filter(s => s.severity === "info").length;

    return (
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-950/20 to-orange-950/20">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-white">
                        Suggestions intelligentes
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                        {errorCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                {errorCount} ⚠
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                {warningCount} ⚡
                            </span>
                        )}
                        {infoCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                {infoCount} 💡
                            </span>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="px-6 pb-4 space-y-2 max-h-60 overflow-auto">
                    {suggestions.map((suggestion, idx) => {
                        const style = SUGGESTION_STYLES[suggestion.severity];
                        const Icon = style.icon;

                        return (
                            <div
                                key={idx}
                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${style.bgColor}`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${style.color}`} />
                                    <p className="text-xs text-gray-200 truncate">{suggestion.message}</p>
                                </div>
                                {suggestion.suggestedAction && (
                                    <button
                                        onClick={() => onApply(suggestion)}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors ml-2 flex-shrink-0 cursor-pointer"
                                    >
                                        <Check className="w-3 h-3" />
                                        Appliquer
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function FamilyTreePage() {
    const [tree, setTree] = useState<TreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(0.8);
    const [panX, setPanX] = useState(50);
    const [panY, setPanY] = useState(30);
    const [selectedMember, setSelectedMember] = useState<TreeMember | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkForm, setLinkForm] = useState({ fromUserId: "", toUserId: "", relationType: "PARENT" as "PARENT" | "SPOUSE" });
    const [searchTerm, setSearchTerm] = useState("");
    const [showStats, setShowStats] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const lastPan = useRef({ x: 0, y: 0 });

    const fetchTree = useCallback(async () => {
        try {
            const data = await apiGet("/family-links/tree");
            setTree(data as TreeData);
        } catch {
            setTree({ members: [], links: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTree(); }, [fetchTree]);

    // ── Layout ──
    const { nodes, edges } = useMemo(() => {
        if (!tree) return { nodes: [], edges: [] };
        return computeLayout(tree.members, tree.links);
    }, [tree]);

    // ── Intelligence computations ──
    const allInferred = useMemo<InferredRelation[]>(() => {
        if (!tree) return [];
        return inferRelations(tree.members, tree.links);
    }, [tree]);

    const suggestions = useMemo<LinkSuggestion[]>(() => {
        if (!tree) return [];
        return suggestMissingLinks(tree.members, tree.links);
    }, [tree]);

    const stats = useMemo<TreeStats | null>(() => {
        if (!tree) return null;
        return computeTreeStats(tree.members, tree.links, allInferred, suggestions);
    }, [tree, allInferred, suggestions]);

    const memberMap = useMemo(() => {
        const map = new Map<string, TreeMember>();
        tree?.members.forEach(m => map.set(m.id, m));
        return map;
    }, [tree]);

    // Inferred relations for selected member
    const selectedInferred = useMemo(() => {
        if (!selectedMember) return [];
        return getInferredRelationsFor(selectedMember.id, allInferred);
    }, [selectedMember, allInferred]);

    // Suggestion IDs for node highlighting
    const suggestedIds = useMemo(() => {
        const ids = new Set<string>();
        suggestions.forEach(s => s.involvedIds.forEach(id => ids.add(id)));
        return ids;
    }, [suggestions]);

    // ── Pan/Zoom ──
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && !(e.target as HTMLElement).closest('[data-node]')) {
            isPanning.current = true;
            lastPan.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning.current) {
            setPanX(p => p + (e.clientX - lastPan.current.x));
            setPanY(p => p + (e.clientY - lastPan.current.y));
            lastPan.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => { isPanning.current = false; };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
    };

    const handleAddLink = async () => {
        if (!linkForm.fromUserId || !linkForm.toUserId) return;
        try {
            await apiPost("/family-links", linkForm);
            setShowLinkModal(false);
            setLinkForm({ fromUserId: "", toUserId: "", relationType: "PARENT" });
            fetchTree();
        } catch (err: any) {
            alert(err?.message || "Erreur lors de la création du lien.");
        }
    };

    const handleDeleteLink = async (linkId: string) => {
        if (!confirm("Supprimer ce lien familial ?")) return;
        try {
            await apiDelete(`/family-links/${linkId}`);
            fetchTree();
        } catch (err: any) {
            alert(err?.message || "Erreur lors de la suppression.");
        }
    };

    const handleApplySuggestion = async (suggestion: LinkSuggestion) => {
        if (!suggestion.suggestedAction) return;
        try {
            await apiPost("/family-links", suggestion.suggestedAction);
            fetchTree();
        } catch (err: any) {
            alert(err?.message || "Erreur lors de l'application.");
        }
    };

    const resetView = () => { setZoom(0.8); setPanX(50); setPanY(30); };

    const nodeMap = useMemo(() => {
        const map = new Map<string, LayoutNode>();
        for (const n of nodes) map.set(n.member.id, n);
        return map;
    }, [nodes]);

    const NODE_W = 160;
    const NODE_H_CARD = 100;

    const renderConnectors = () => {
        return edges.map((edge) => {
            const from = nodeMap.get(edge.fromUserId);
            const to = nodeMap.get(edge.toUserId);
            if (!from || !to) return null;

            const fromCx = from.x + NODE_W / 2;
            const toCx = to.x + NODE_W / 2;

            if (edge.relationType === "SPOUSE") {
                const y = Math.min(from.y, to.y) + NODE_H_CARD / 2;
                return (
                    <line
                        key={edge.id}
                        x1={Math.min(from.x + NODE_W, to.x + NODE_W)}
                        y1={y}
                        x2={Math.max(from.x, to.x)}
                        y2={y}
                        stroke="#ec489980"
                        strokeWidth={2}
                        strokeDasharray="6,4"
                    />
                );
            }

            const fromY = from.y + NODE_H_CARD;
            const toY = to.y;
            const midY = (fromY + toY) / 2;

            return (
                <g key={edge.id}>
                    <line x1={fromCx} y1={fromY} x2={fromCx} y2={midY} stroke="#3b82f640" strokeWidth={2} />
                    <line x1={fromCx} y1={midY} x2={toCx} y2={midY} stroke="#3b82f640" strokeWidth={2} />
                    <line x1={toCx} y1={midY} x2={toCx} y2={toY} stroke="#3b82f640" strokeWidth={2} />
                    <polygon
                        points={`${toCx - 4},${toY - 6} ${toCx + 4},${toY - 6} ${toCx},${toY}`}
                        fill="#3b82f660"
                    />
                </g>
            );
        });
    };

    const highlightedIds = useMemo(() => {
        if (!searchTerm.trim()) return new Set<string>();
        const t = searchTerm.toLowerCase();
        return new Set(
            tree?.members
                .filter(m => fullName(m).toLowerCase().includes(t) || m.email.toLowerCase().includes(t))
                .map(m => m.id) || []
        );
    }, [searchTerm, tree]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-white">🌳 Arbre Généalogique</h1>
                    <span className="text-xs text-gray-500">
                        {tree?.members.length || 0} membres · {tree?.links.length || 0} liens
                        {allInferred.length > 0 && (
                            <span className="text-purple-400 ml-1">· 🧠 {allInferred.length} déduits</span>
                        )}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-40 pl-7 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 px-1">
                        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button onClick={resetView} className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer" title="Réinitialiser la vue">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle stats */}
                    <button
                        onClick={() => setShowStats(s => !s)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showStats ? "text-blue-400 bg-blue-500/10 border border-blue-500/30" : "text-gray-400 hover:text-white"}`}
                        title="Statistiques"
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle suggestions */}
                    {suggestions.length > 0 && (
                        <button
                            onClick={() => setShowSuggestions(s => !s)}
                            className={`relative p-1.5 rounded-lg transition-colors cursor-pointer ${showSuggestions ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30" : "text-gray-400 hover:text-white"}`}
                            title="Suggestions"
                        >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[8px] font-bold bg-yellow-500 text-black rounded-full flex items-center justify-center">
                                {suggestions.length}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                    >
                        <Link2 className="w-3.5 h-3.5" />
                        Lier des membres
                    </button>
                </div>
            </div>

            {/* ── Stats Panel ── */}
            {stats && showStats && (
                <StatsPanel stats={stats} isOpen={showStats} toggle={() => setShowStats(s => !s)} />
            )}

            {/* ── Suggestions Banner ── */}
            {showSuggestions && (
                <SuggestionsBanner
                    suggestions={suggestions}
                    isOpen={showSuggestions}
                    toggle={() => setShowSuggestions(s => !s)}
                    onApply={handleApplySuggestion}
                    memberMap={memberMap}
                />
            )}

            {/* ── Canvas ── */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
            >
                {nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Aucun lien familial</h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Ajoutez des membres puis créez des liens de parenté ou de couple pour construire l&apos;arbre généalogique.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                        >
                            <Link2 className="w-4 h-4" />
                            Créer un lien
                        </button>
                    </div>
                ) : (
                    <div
                        style={{
                            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                            transformOrigin: "0 0",
                        }}
                    >
                        <svg
                            className="absolute top-0 left-0 pointer-events-none"
                            style={{
                                width: Math.max(...nodes.map(n => n.x)) + NODE_W + 200,
                                height: Math.max(...nodes.map(n => n.y)) + 300,
                            }}
                        >
                            {renderConnectors()}
                        </svg>

                        {nodes.map((node) => {
                            const m = node.member;
                            const gs = getGenderStyle(m.gender);
                            const isHighlighted = highlightedIds.size > 0 && highlightedIds.has(m.id);
                            const isDimmed = highlightedIds.size > 0 && !highlightedIds.has(m.id);
                            const hasSuggestion = suggestedIds.has(m.id);

                            return (
                                <div
                                    key={m.id}
                                    data-node
                                    className={`absolute transition-all duration-200 cursor-pointer group ${isDimmed ? "opacity-30" : "opacity-100"}`}
                                    style={{ left: node.x, top: node.y, width: NODE_W }}
                                    onClick={() => setSelectedMember(m)}
                                >
                                    <div
                                        className={`
                                            relative rounded-xl p-3 text-center
                                            border transition-all duration-200
                                            group-hover:shadow-lg group-hover:scale-105
                                            ${m.isVirtual ? "border-dashed opacity-70" : "border-solid"}
                                            ${isHighlighted ? "ring-2 ring-yellow-400 shadow-yellow-400/20" : ""}
                                            ${hasSuggestion && !isHighlighted ? "ring-1 ring-yellow-500/40 animate-pulse" : ""}
                                        `}
                                        style={{
                                            backgroundColor: `${gs.bg}15`,
                                            borderColor: `${gs.border}40`,
                                            boxShadow: isHighlighted ? `0 0 20px ${gs.bg}30` : undefined,
                                        }}
                                    >
                                        <div
                                            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-sm font-bold uppercase mb-2"
                                            style={{ background: gs.gradient }}
                                        >
                                            {initials(m)}
                                        </div>
                                        <p className="text-xs font-semibold text-white truncate">{fullName(m)}</p>
                                        {m.gender && (
                                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full"
                                                style={{ backgroundColor: `${gs.bg}30`, color: gs.border }}
                                            >
                                                {m.gender === "MALE" ? "♂" : m.gender === "FEMALE" ? "♀" : "⚧"}
                                            </span>
                                        )}
                                        {m.isVirtual && <p className="text-[9px] text-gray-500 mt-1 italic">Ancêtre</p>}
                                        {m.family_branch && <p className="text-[9px] text-gray-500 mt-0.5 truncate">{m.family_branch}</p>}

                                        {/* Suggestion indicator */}
                                        {hasSuggestion && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                                <Lightbulb className="w-2.5 h-2.5 text-black" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Link Modal ── */}
            {showLinkModal && tree && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowLinkModal(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                                <h3 className="text-base font-semibold text-white">Créer un lien familial</h3>
                                <button onClick={() => setShowLinkModal(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">Type de lien</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setLinkForm(f => ({ ...f, relationType: "PARENT" }))}
                                            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${linkForm.relationType === "PARENT" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                                        >
                                            👨‍👧 Parent → Enfant
                                        </button>
                                        <button
                                            onClick={() => setLinkForm(f => ({ ...f, relationType: "SPOUSE" }))}
                                            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${linkForm.relationType === "SPOUSE" ? "bg-pink-600/20 border-pink-500 text-pink-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                                        >
                                            💑 Conjoint(e)s
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">
                                        {linkForm.relationType === "PARENT" ? "Parent" : "Membre 1"}
                                    </label>
                                    <select
                                        value={linkForm.fromUserId}
                                        onChange={(e) => setLinkForm(f => ({ ...f, fromUserId: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {tree.members.map(m => (
                                            <option key={m.id} value={m.id}>{fullName(m)}{m.gender ? ` (${m.gender === "MALE" ? "H" : "F"})` : ""}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">
                                        {linkForm.relationType === "PARENT" ? "Enfant" : "Membre 2"}
                                    </label>
                                    <select
                                        value={linkForm.toUserId}
                                        onChange={(e) => setLinkForm(f => ({ ...f, toUserId: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {tree.members.filter(m => m.id !== linkForm.fromUserId).map(m => (
                                            <option key={m.id} value={m.id}>{fullName(m)}{m.gender ? ` (${m.gender === "MALE" ? "H" : "F"})` : ""}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddLink}
                                    disabled={!linkForm.fromUserId || !linkForm.toUserId}
                                    className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors cursor-pointer"
                                >
                                    Créer le lien
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Member Detail Panel ── */}
            {selectedMember && tree && (
                <>
                    <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setSelectedMember(null)} />
                    <div className="fixed right-0 top-0 bottom-0 z-40 w-96 bg-slate-900/95 border-l border-white/10 backdrop-blur-md shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h4 className="text-sm font-semibold text-white">Détails du membre</h4>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-5">
                            {/* Identity */}
                            <div className="text-center">
                                <div
                                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold uppercase mb-2"
                                    style={{ background: getGenderStyle(selectedMember.gender).gradient }}
                                >
                                    {initials(selectedMember)}
                                </div>
                                <h5 className="text-base font-bold text-white">{fullName(selectedMember)}</h5>
                                <p className="text-xs text-gray-400">{selectedMember.email}</p>
                                {selectedMember.isVirtual && (
                                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                        Membre virtuel (ancêtre)
                                    </span>
                                )}
                            </div>

                            {/* Direct Family Links */}
                            <div>
                                <h6 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Link2 className="w-3 h-3" /> Liens directs
                                </h6>
                                {tree.links
                                    .filter(l => l.fromUserId === selectedMember.id || l.toUserId === selectedMember.id)
                                    .map(link => {
                                        const isFrom = link.fromUserId === selectedMember.id;
                                        const otherId = isFrom ? link.toUserId : link.fromUserId;
                                        const other = tree.members.find(m => m.id === otherId);
                                        if (!other) return null;

                                        let label: string;
                                        if (link.relationType === "SPOUSE") label = "Conjoint(e)";
                                        else if (isFrom) label = "Parent de";
                                        else label = "Enfant de";

                                        return (
                                            <div key={link.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase"
                                                        style={{ background: getGenderStyle(other.gender).gradient }}
                                                    >
                                                        {initials(other)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white font-medium">{fullName(other)}</p>
                                                        <p className="text-[10px] text-gray-500">{label}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteLink(link.id)}
                                                    className="w-5 h-5 rounded bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })
                                }
                                {tree.links.filter(l => l.fromUserId === selectedMember.id || l.toUserId === selectedMember.id).length === 0 && (
                                    <p className="text-xs text-gray-500 italic">Aucun lien direct</p>
                                )}
                            </div>

                            {/* ── 🧠 Inferred Relations ── */}
                            {selectedInferred.length > 0 && (
                                <div>
                                    <h6 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Brain className="w-3 h-3" /> Relations déduites
                                    </h6>
                                    <p className="text-[10px] text-gray-500 mb-2 italic">
                                        Ces relations sont calculées automatiquement à partir de l&apos;arbre.
                                    </p>
                                    {selectedInferred.map((rel, idx) => {
                                        const other = memberMap.get(rel.memberId);
                                        if (!other) return null;
                                        const icon = RELATION_ICONS[rel.relation] || "🔗";

                                        return (
                                            <div key={idx} className="flex items-center gap-2 bg-purple-500/5 border border-purple-500/15 rounded-lg px-3 py-2 mb-1.5">
                                                <span className="text-sm">{icon}</span>
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase"
                                                    style={{ background: getGenderStyle(other.gender).gradient }}
                                                >
                                                    {initials(other)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-white font-medium truncate">{fullName(other)}</p>
                                                    <p className="text-[10px] text-purple-400">{rel.label}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedMember(other)}
                                                    className="w-5 h-5 rounded bg-purple-500/10 hover:bg-purple-500/20 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                                                    title="Voir ce membre"
                                                >
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Suggestions for this member */}
                            {suggestions.filter(s => s.involvedIds.includes(selectedMember.id)).length > 0 && (
                                <div>
                                    <h6 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Lightbulb className="w-3 h-3" /> Suggestions
                                    </h6>
                                    {suggestions
                                        .filter(s => s.involvedIds.includes(selectedMember.id))
                                        .map((s, idx) => {
                                            const style = SUGGESTION_STYLES[s.severity];
                                            const Icon = style.icon;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`rounded-lg px-3 py-2 mb-1.5 border ${style.bgColor}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${style.color}`} />
                                                        <p className="text-[11px] text-gray-200">{s.message}</p>
                                                    </div>
                                                    {s.suggestedAction && (
                                                        <button
                                                            onClick={() => handleApplySuggestion(s)}
                                                            className="mt-1.5 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Appliquer
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
