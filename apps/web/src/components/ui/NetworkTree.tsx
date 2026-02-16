"use client";

import GlassCard from "@/components/ui/GlassCard";
import { Building2, MapPin, Users, Globe, Landmark, Home } from "lucide-react";

interface TreeNode {
    id: string;
    name: string;
    address_city?: string;
    networkLevel: string;
    is_active?: boolean;
    members?: number;
    finance?: { expected: number; collected: number };
    events?: number;
    children?: TreeNode[];
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    INTERNATIONAL: { bg: "bg-purple-500/20", text: "text-purple-300", icon: Globe },
    NATIONAL: { bg: "bg-blue-500/20", text: "text-blue-300", icon: Landmark },
    REGIONAL: { bg: "bg-emerald-500/20", text: "text-emerald-300", icon: MapPin },
    LOCAL: { bg: "bg-amber-500/20", text: "text-amber-300", icon: Home },
};

function NodeCard({ node, isRoot }: { node: TreeNode; isRoot?: boolean }) {
    const level = LEVEL_STYLES[node.networkLevel] || LEVEL_STYLES.LOCAL;
    const Icon = level.icon;

    return (
        <div className="relative">
            <GlassCard
                className={`p-4 min-w-[220px] ${isRoot ? "border-blue-500/30 bg-blue-500/5" : ""
                    } transition-all duration-200 hover:bg-white/[0.08]`}
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`w-9 h-9 rounded-lg ${level.bg} flex items-center justify-center shrink-0`}
                    >
                        {isRoot ? (
                            <Building2 className={`w-4 h-4 ${level.text}`} />
                        ) : (
                            <Icon className={`w-4 h-4 ${level.text}`} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {node.name}
                        </p>
                        {node.address_city && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {node.address_city}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${level.bg} ${level.text}`}
                            >
                                {node.networkLevel}
                            </span>
                            {node.members !== undefined && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {node.members}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {node.is_active === false && (
                    <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 rounded px-2 py-0.5 text-center">
                        Inactive
                    </div>
                )}
            </GlassCard>
        </div>
    );
}

function TreeBranch({
    node,
    isRoot,
    isLast,
}: {
    node: TreeNode;
    isRoot?: boolean;
    isLast?: boolean;
}) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <li
            className={`relative ${isRoot ? "" : "pl-8"}`}
            style={{ listStyle: "none" }}
        >
            {/* Connector lines */}
            {!isRoot && (
                <>
                    {/* Horizontal line */}
                    <div
                        className="absolute left-0 top-6 w-8 border-t border-white/10"
                        style={{ borderStyle: "dashed" }}
                    />
                    {/* Vertical line */}
                    <div
                        className={`absolute left-0 top-0 border-l border-white/10 ${isLast ? "h-6" : "h-full"
                            }`}
                        style={{ borderStyle: "dashed" }}
                    />
                </>
            )}

            <NodeCard node={node} isRoot={isRoot} />

            {hasChildren && (
                <ul className="mt-2 space-y-2">
                    {node.children!.map((child, i) => (
                        <TreeBranch
                            key={child.id}
                            node={child}
                            isLast={i === node.children!.length - 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function NetworkTree({
    root,
}: {
    root: TreeNode;
}) {
    return (
        <div className="overflow-x-auto">
            <ul className="space-y-2 min-w-[300px]">
                <TreeBranch node={root} isRoot />
            </ul>
        </div>
    );
}
