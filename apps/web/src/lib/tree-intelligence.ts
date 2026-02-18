// ─── Tree Intelligence Engine ────────────────────
// Provides: relation inference, missing link suggestions, and tree statistics.

export interface TreeMember {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    gender: string | null;
    isVirtual: boolean;
    avatar_url: string | null;
    birth_date: string | null;
    role: string;
    status: string;
    family_branch: string | null;
}

export interface TreeLink {
    id: string;
    fromUserId: string;
    toUserId: string;
    relationType: "PARENT" | "SPOUSE";
}

// ═══════════════════════════════════════════════════
// 1. RELATION INFERENCE
// ═══════════════════════════════════════════════════

export interface InferredRelation {
    fromId: string;
    toId: string;
    relation: string;       // "GRANDPARENT" | "GRANDCHILD" | "SIBLING" | "UNCLE_AUNT" | "NEPHEW_NIECE" | "COUSIN"
    label: string;          // Human-readable French label
    path: string[];         // Chain of IDs showing the path
}

export function inferRelations(members: TreeMember[], links: TreeLink[]): InferredRelation[] {
    const childrenMap = new Map<string, Set<string>>();   // parent → children
    const parentsMap = new Map<string, Set<string>>();    // child → parents
    const spouseMap = new Map<string, string>();           // user → spouse

    for (const link of links) {
        if (link.relationType === "PARENT") {
            if (!childrenMap.has(link.fromUserId)) childrenMap.set(link.fromUserId, new Set());
            childrenMap.get(link.fromUserId)!.add(link.toUserId);

            if (!parentsMap.has(link.toUserId)) parentsMap.set(link.toUserId, new Set());
            parentsMap.get(link.toUserId)!.add(link.fromUserId);
        } else if (link.relationType === "SPOUSE") {
            spouseMap.set(link.fromUserId, link.toUserId);
            spouseMap.set(link.toUserId, link.fromUserId);
        }
    }

    const memberMap = new Map(members.map(m => [m.id, m]));
    const inferred: InferredRelation[] = [];
    const seen = new Set<string>(); // avoid duplicate A↔B

    const addIfNew = (fromId: string, toId: string, relation: string, label: string, path: string[]) => {
        const key = [fromId, toId, relation].sort().join("|");
        if (!seen.has(key)) {
            seen.add(key);
            inferred.push({ fromId, toId, relation, label, path });
        }
    };

    // ── Siblings: share at least one parent ──
    for (const [parentId, children] of childrenMap) {
        const childArr = Array.from(children);
        for (let i = 0; i < childArr.length; i++) {
            for (let j = i + 1; j < childArr.length; j++) {
                const a = childArr[i], b = childArr[j];
                // Check if they share ALL parents (full) or only some (half)
                const aParents = parentsMap.get(a) || new Set();
                const bParents = parentsMap.get(b) || new Set();
                const shared = [...aParents].filter(p => bParents.has(p)).length;
                const label = shared >= 2 ? "Frère / Sœur" : "Demi-frère / Demi-sœur";
                addIfNew(a, b, "SIBLING", label, [a, parentId, b]);
            }
        }
    }

    // ── Grandparents / Grandchildren ──
    for (const [parentId, children] of childrenMap) {
        for (const childId of children) {
            const grandchildren = childrenMap.get(childId);
            if (grandchildren) {
                for (const gcId of grandchildren) {
                    const gp = memberMap.get(parentId);
                    const gpLabel = gp?.gender === "FEMALE" ? "Grand-mère" : gp?.gender === "MALE" ? "Grand-père" : "Grand-parent";
                    addIfNew(parentId, gcId, "GRANDPARENT", gpLabel, [parentId, childId, gcId]);

                    const gc = memberMap.get(gcId);
                    const gcLabel = gc?.gender === "FEMALE" ? "Petite-fille" : gc?.gender === "MALE" ? "Petit-fils" : "Petit-enfant";
                    addIfNew(gcId, parentId, "GRANDCHILD", gcLabel, [gcId, childId, parentId]);
                }
            }
        }
    }

    // ── Uncle/Aunt ↔ Nephew/Niece ──
    for (const [memberId, parents] of parentsMap) {
        for (const parentId of parents) {
            // Parent's siblings = uncle/aunt
            const grandparents = parentsMap.get(parentId);
            if (grandparents) {
                for (const gpId of grandparents) {
                    const gpChildren = childrenMap.get(gpId);
                    if (gpChildren) {
                        for (const uncleId of gpChildren) {
                            if (uncleId !== parentId) {
                                const uncle = memberMap.get(uncleId);
                                const uLabel = uncle?.gender === "FEMALE" ? "Tante" : uncle?.gender === "MALE" ? "Oncle" : "Oncle / Tante";
                                addIfNew(uncleId, memberId, "UNCLE_AUNT", uLabel, [uncleId, gpId, parentId, memberId]);

                                const member = memberMap.get(memberId);
                                const nLabel = member?.gender === "FEMALE" ? "Nièce" : member?.gender === "MALE" ? "Neveu" : "Neveu / Nièce";
                                addIfNew(memberId, uncleId, "NEPHEW_NIECE", nLabel, [memberId, parentId, gpId, uncleId]);
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Cousins ──
    for (const [memberId, parents] of parentsMap) {
        for (const parentId of parents) {
            const grandparents = parentsMap.get(parentId);
            if (grandparents) {
                for (const gpId of grandparents) {
                    const gpChildren = childrenMap.get(gpId);
                    if (gpChildren) {
                        for (const uncleId of gpChildren) {
                            if (uncleId !== parentId) {
                                const cousinSet = childrenMap.get(uncleId);
                                if (cousinSet) {
                                    for (const cousinId of cousinSet) {
                                        addIfNew(memberId, cousinId, "COUSIN", "Cousin(e)", [memberId, parentId, gpId, uncleId, cousinId]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return inferred;
}

// Get inferred relations for a specific member
export function getInferredRelationsFor(memberId: string, allInferred: InferredRelation[]): {
    relation: string;
    label: string;
    memberId: string;
}[] {
    return allInferred
        .filter(r => r.fromId === memberId || r.toId === memberId)
        .map(r => ({
            relation: r.relation,
            label: r.label,
            memberId: r.fromId === memberId ? r.toId : r.fromId,
        }));
}

// ═══════════════════════════════════════════════════
// 2. MISSING LINK SUGGESTIONS
// ═══════════════════════════════════════════════════

export interface LinkSuggestion {
    type: "SPOUSE_MISSING" | "SAME_NAME_UNLINKED" | "ORPHAN" | "AGE_INCONSISTENCY";
    severity: "info" | "warning" | "error";
    message: string;
    involvedIds: string[];
    suggestedAction?: {
        fromUserId: string;
        toUserId: string;
        relationType: "PARENT" | "SPOUSE";
    };
}

export function suggestMissingLinks(members: TreeMember[], links: TreeLink[]): LinkSuggestion[] {
    const suggestions: LinkSuggestion[] = [];

    const childrenMap = new Map<string, Set<string>>();
    const parentsMap = new Map<string, Set<string>>();
    const spouseMap = new Map<string, string>();
    const linkedIds = new Set<string>();

    for (const link of links) {
        linkedIds.add(link.fromUserId);
        linkedIds.add(link.toUserId);
        if (link.relationType === "PARENT") {
            if (!childrenMap.has(link.fromUserId)) childrenMap.set(link.fromUserId, new Set());
            childrenMap.get(link.fromUserId)!.add(link.toUserId);
            if (!parentsMap.has(link.toUserId)) parentsMap.set(link.toUserId, new Set());
            parentsMap.get(link.toUserId)!.add(link.fromUserId);
        } else {
            spouseMap.set(link.fromUserId, link.toUserId);
            spouseMap.set(link.toUserId, link.fromUserId);
        }
    }

    const memberMap = new Map(members.map(m => [m.id, m]));
    const fullName = (m: TreeMember) => [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;

    // ── Orphan members (no links at all) ──
    for (const m of members) {
        if (!linkedIds.has(m.id)) {
            suggestions.push({
                type: "ORPHAN",
                severity: "info",
                message: `${fullName(m)} n'a aucun lien familial. Rattachez-le à l'arbre.`,
                involvedIds: [m.id],
            });
        }
    }

    // ── Spouse suggestion: children share a parent but that parent has no spouse ──
    for (const [parentId, children] of childrenMap) {
        if (children.size > 0 && !spouseMap.has(parentId)) {
            // Check if any child has another parent → that's the likely spouse
            for (const childId of children) {
                const childParents = parentsMap.get(childId);
                if (childParents && childParents.size > 1) {
                    for (const otherParentId of childParents) {
                        if (otherParentId !== parentId && !spouseMap.has(otherParentId)) {
                            const p1 = memberMap.get(parentId);
                            const p2 = memberMap.get(otherParentId);
                            if (p1 && p2) {
                                suggestions.push({
                                    type: "SPOUSE_MISSING",
                                    severity: "warning",
                                    message: `${fullName(p1)} et ${fullName(p2)} partagent des enfants mais ne sont pas liés comme conjoints.`,
                                    involvedIds: [parentId, otherParentId],
                                    suggestedAction: {
                                        fromUserId: parentId,
                                        toUserId: otherParentId,
                                        relationType: "SPOUSE",
                                    },
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Same last name, not linked ──
    const byLastName = new Map<string, TreeMember[]>();
    for (const m of members) {
        if (m.lastName) {
            const key = m.lastName.toLowerCase().trim();
            if (!byLastName.has(key)) byLastName.set(key, []);
            byLastName.get(key)!.push(m);
        }
    }

    for (const [name, group] of byLastName) {
        if (group.length < 2) continue;

        // Find members in this group that have no direct link between them
        const unlinkedPairs: [TreeMember, TreeMember][] = [];
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const a = group[i], b = group[j];
                // Check if there's any direct link between a and b
                const hasDirectLink = links.some(l =>
                    (l.fromUserId === a.id && l.toUserId === b.id) ||
                    (l.fromUserId === b.id && l.toUserId === a.id)
                );
                if (!hasDirectLink) {
                    unlinkedPairs.push([a, b]);
                }
            }
        }

        if (unlinkedPairs.length > 0 && unlinkedPairs.length <= 5) {
            for (const [a, b] of unlinkedPairs) {
                suggestions.push({
                    type: "SAME_NAME_UNLINKED",
                    severity: "info",
                    message: `${fullName(a)} et ${fullName(b)} partagent le nom "${a.lastName}" mais ne sont pas liés directement.`,
                    involvedIds: [a.id, b.id],
                });
            }
        } else if (unlinkedPairs.length > 5) {
            suggestions.push({
                type: "SAME_NAME_UNLINKED",
                severity: "info",
                message: `${group.length} membres portent le nom "${group[0].lastName}" — certains ne sont pas liés entre eux.`,
                involvedIds: group.map(m => m.id),
            });
        }
    }

    // ── Age inconsistency: child older than parent ──
    for (const [parentId, children] of childrenMap) {
        const parent = memberMap.get(parentId);
        if (!parent?.birth_date) continue;
        const parentBirth = new Date(parent.birth_date).getTime();

        for (const childId of children) {
            const child = memberMap.get(childId);
            if (!child?.birth_date) continue;
            const childBirth = new Date(child.birth_date).getTime();

            const ageDiffYears = (childBirth - parentBirth) / (365.25 * 24 * 60 * 60 * 1000);
            if (ageDiffYears < 12) {
                suggestions.push({
                    type: "AGE_INCONSISTENCY",
                    severity: "error",
                    message: ageDiffYears < 0
                        ? `${fullName(child)} est plus âgé(e) que son parent ${fullName(parent)} !`
                        : `Seulement ${Math.round(ageDiffYears)} ans d'écart entre ${fullName(parent)} et ${fullName(child)}.`,
                    involvedIds: [parentId, childId],
                });
            }
        }
    }

    return suggestions;
}

// ═══════════════════════════════════════════════════
// 3. TREE STATISTICS
// ═══════════════════════════════════════════════════

export interface TreeStats {
    totalMembers: number;
    realMembers: number;
    virtualMembers: number;
    totalLinks: number;
    parentLinks: number;
    spouseLinks: number;
    generations: number;
    averageSiblings: number;
    largestBranch: { name: string; count: number } | null;
    genderDistribution: { male: number; female: number; other: number; unknown: number };
    countriesRepresented: { country: string; count: number }[];
    orphanCount: number;
    inferredRelationsCount: number;
    suggestionsCount: number;
}

export function computeTreeStats(
    members: TreeMember[],
    links: TreeLink[],
    inferred: InferredRelation[],
    suggestions: LinkSuggestion[],
): TreeStats {
    // Basic counts
    const realMembers = members.filter(m => !m.isVirtual).length;
    const virtualMembers = members.filter(m => m.isVirtual).length;
    const parentLinks = links.filter(l => l.relationType === "PARENT").length;
    const spouseLinks = links.filter(l => l.relationType === "SPOUSE").length;

    // Generations (BFS)
    const childrenMap = new Map<string, Set<string>>();
    const parentsMap = new Map<string, Set<string>>();
    const linkedIds = new Set<string>();

    for (const link of links) {
        linkedIds.add(link.fromUserId);
        linkedIds.add(link.toUserId);
        if (link.relationType === "PARENT") {
            if (!childrenMap.has(link.fromUserId)) childrenMap.set(link.fromUserId, new Set());
            childrenMap.get(link.fromUserId)!.add(link.toUserId);
            if (!parentsMap.has(link.toUserId)) parentsMap.set(link.toUserId, new Set());
            parentsMap.get(link.toUserId)!.add(link.fromUserId);
        }
    }

    const roots = members.filter(m => !(parentsMap.get(m.id)?.size));
    const genMap = new Map<string, number>();
    const queue: { id: string; gen: number }[] = roots.map(r => ({ id: r.id, gen: 0 }));
    const visited = new Set<string>(roots.map(r => r.id));

    while (queue.length) {
        const { id, gen } = queue.shift()!;
        genMap.set(id, gen);
        const kids = childrenMap.get(id);
        if (kids) {
            for (const kid of kids) {
                if (!visited.has(kid)) {
                    visited.add(kid);
                    queue.push({ id: kid, gen: gen + 1 });
                }
            }
        }
    }

    const maxGen = genMap.size > 0 ? Math.max(...genMap.values()) + 1 : 0;

    // Average siblings (avg children per parent that has children)
    const parentSizes = Array.from(childrenMap.values()).map(s => s.size).filter(s => s > 0);
    const avgSiblings = parentSizes.length > 0
        ? Math.round((parentSizes.reduce((a, b) => a + b, 0) / parentSizes.length) * 10) / 10
        : 0;

    // Largest branch by family_branch
    const branchCounts = new Map<string, number>();
    for (const m of members) {
        if (m.family_branch) {
            branchCounts.set(m.family_branch, (branchCounts.get(m.family_branch) || 0) + 1);
        }
    }
    let largestBranch: { name: string; count: number } | null = null;
    for (const [name, count] of branchCounts) {
        if (!largestBranch || count > largestBranch.count) {
            largestBranch = { name, count };
        }
    }

    // Gender distribution
    const genderDistribution = { male: 0, female: 0, other: 0, unknown: 0 };
    for (const m of members) {
        if (m.gender === "MALE") genderDistribution.male++;
        else if (m.gender === "FEMALE") genderDistribution.female++;
        else if (m.gender === "OTHER") genderDistribution.other++;
        else genderDistribution.unknown++;
    }

    // Countries (from member data — we don't have residence here but we can use family_branch as proxy)
    // Note: In a real scenario, residence_country would be available. For now, stub.
    const countriesRepresented: { country: string; count: number }[] = [];

    // Orphans
    const orphanCount = members.filter(m => !linkedIds.has(m.id)).length;

    return {
        totalMembers: members.length,
        realMembers,
        virtualMembers,
        totalLinks: links.length,
        parentLinks,
        spouseLinks,
        generations: maxGen,
        averageSiblings: avgSiblings,
        largestBranch,
        genderDistribution,
        countriesRepresented,
        orphanCount,
        inferredRelationsCount: inferred.length,
        suggestionsCount: suggestions.length,
    };
}
