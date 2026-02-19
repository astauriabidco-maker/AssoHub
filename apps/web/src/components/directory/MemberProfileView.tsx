"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
    UserCircle,
    Mail,
    Shield,
    Pencil,
    Check,
    X,
    User,
    Briefcase,
    Award,
    Plus,
    Eye,
    Heart,
    GitBranch,
    MapPin,
    Network,
    CreditCard,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    LayoutDashboard,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import { apiPatch, apiGet, apiPost, apiDelete } from "@/lib/api";
import {
    PRO_STATUS_LABELS,
    SECTOR_LABELS,
    EDUCATION_LABELS,
    SKILL_CATEGORY_COLORS,
    SKILL_CATEGORY_LABELS,
    type DirectorySkill,
} from "@/components/directory/constants";

interface FamilyLinkResolved {
    id: string;
    relationType: string;
    resolvedType: string;
    relatedUser: { id: string; firstName: string; lastName: string; gender: string | null };
}

interface MemberOption {
    id: string;
    firstName: string;
    lastName: string;
    gender?: string | null;
}

interface Fee {
    id: string;
    label: string;
    amount: number;
    status: string;
    dueDate: string;
    paidAt: string | null;
}

interface SecondaryAssociation {
    id: string;
    role: string;
    joinedAt: string;
    association: {
        id: string;
        name: string;
        address_city?: string;
    };
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    SUPER_ADMIN: "bg-red-500/20 text-red-300 border-red-500/30",
    TREASURER: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    SECRETARY: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    MEMBER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    PRESIDENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrateur",
    SUPER_ADMIN: "Super Admin",
    TREASURER: "Trésorier",
    SECRETARY: "Secrétaire",
    MEMBER: "Membre",
    PRESIDENT: "Président",
};

const VISIBILITY_LABELS: Record<string, string> = {
    PRIVATE: "🔒 Privé — Visible par moi uniquement",
    MEMBERS: "👥 Membres — Visible par les membres",
    PUBLIC: "🌍 Public — Visible par tous",
};

interface MemberProfileViewProps {
    userId: string;
    isEditable: boolean;
    onClose?: () => void;
}

export default function MemberProfileView({ userId, isEditable, onClose }: MemberProfileViewProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ firstName: "", lastName: "" });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Professional section
    const [proEditing, setProEditing] = useState(false);
    const [proForm, setProForm] = useState({
        professionalStatus: "",
        jobTitle: "",
        industrySector: "",
        employer: "",
        educationLevel: "",
        fieldOfStudy: "",
        availableForMentoring: false,
        profileVisibility: "MEMBERS",
    });
    const [proSaving, setProSaving] = useState(false);
    const [proSuccess, setProSuccess] = useState(false);

    // Skills
    const [skills, setSkills] = useState<DirectorySkill[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [newSkillCategory, setNewSkillCategory] = useState("TECHNICAL");

    // Family
    const [familyLinks, setFamilyLinks] = useState<FamilyLinkResolved[]>([]);
    const [familyEditing, setFamilyEditing] = useState(false);
    const [familyParentIds, setFamilyParentIds] = useState<string[]>([]);
    const [familySpouseId, setFamilySpouseId] = useState("");
    const [initialParentIds, setInitialParentIds] = useState<string[]>([]);
    const [initialSpouseId, setInitialSpouseId] = useState("");
    const [initialSpouseLinkId, setInitialSpouseLinkId] = useState("");
    const [parentLinkIds, setParentLinkIds] = useState<Record<string, string>>({});
    const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
    const [familySaving, setFamilySaving] = useState(false);

    // Network & Finance
    const [fees, setFees] = useState<Fee[]>([]);
    const [feesLoading, setFeesLoading] = useState(false);
    const [secondaryAssociations, setSecondaryAssociations] = useState<SecondaryAssociation[]>([]);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "professional" | "family" | "network">("overview");

    function showToast(message: string, type: "success" | "error" = "success") {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    // Load full profile data
    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        const fetchAll = async () => {
            try {
                // 1. User Profile
                const userData = await apiGet(`/directory/user/${userId}`);
                setUser(userData);

                // Initialize forms
                setForm({
                    firstName: (userData as any).firstName || "",
                    lastName: (userData as any).lastName || "",
                });
                setProForm({
                    professionalStatus: (userData as any).professionalStatus || "",
                    jobTitle: (userData as any).jobTitle || "",
                    industrySector: (userData as any).industrySector || "",
                    employer: (userData as any).employer || "",
                    educationLevel: (userData as any).educationLevel || "",
                    fieldOfStudy: (userData as any).fieldOfStudy || "",
                    availableForMentoring: !!(userData as any).availableForMentoring,
                    profileVisibility: (userData as any).profileVisibility || "MEMBERS",
                });

                // 2. Skills
                const skillsData = await apiGet(`/directory/skills/user/${userId}`);
                setSkills(skillsData as DirectorySkill[]);

                // 3. Family Links
                const familyData = await apiGet(`/family-links/user/${userId}`);
                const links = familyData as FamilyLinkResolved[];
                setFamilyLinks(links);

                // Setup family edit state
                const pIds = links.filter((l) => l.resolvedType === "CHILD").map((l) => l.relatedUser.id);
                const pLinkMap: Record<string, string> = {};
                links.filter((l) => l.resolvedType === "CHILD").forEach((l) => { pLinkMap[l.relatedUser.id] = l.id; });
                setFamilyParentIds(pIds);
                setInitialParentIds(pIds);
                setParentLinkIds(pLinkMap);

                const spLink = links.find((l) => l.resolvedType === "SPOUSE");
                setFamilySpouseId(spLink?.relatedUser?.id || "");
                setInitialSpouseId(spLink?.relatedUser?.id || "");
                setInitialSpouseLinkId(spLink?.id || "");

                // 4. Load Network & Finance (if allowed)
                apiGet(`/user-associations/user/${userId}`)
                    .then((data) => setSecondaryAssociations(data as SecondaryAssociation[]))
                    .catch(() => setSecondaryAssociations([]));

                setFeesLoading(true);
                apiGet(`/finance/fees/user/${userId}`)
                    .then((data) => setFees(data as Fee[]))
                    .catch(() => setFees([]))
                    .finally(() => setFeesLoading(false));

                // 5. Load all members if editable (for selectors)
                if (isEditable) {
                    const membersData = await apiGet("/users");
                    const d = membersData as { data?: MemberOption[] };
                    const members = (d.data || (membersData as MemberOption[]));
                    setAllMembers(members.filter((m: MemberOption) => m.id !== userId));
                }

            } catch (error) {
                console.error("Failed to load profile", error);
                showToast("Erreur lors du chargement du profil.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [userId, isEditable]);

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Chargement du profil...</div>;
    }

    if (!user) return <div className="p-8 text-center text-red-400">Utilisateur introuvable.</div>;

    const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || user.email[0] || "");
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    // Handlers
    function startEdit() {
        setEditing(true);
        setSuccess(false);
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await apiPatch(`/users/${userId}`, form);
            const updatedUser = { ...user, ...form };
            setUser(updatedUser);
            setEditing(false);
            setSuccess(true);
            showToast("Profil mis à jour !");
            setTimeout(() => setSuccess(false), 3000);
        } catch {
            showToast("Erreur lors de la sauvegarde.", "error");
        } finally {
            setSaving(false);
        }
    }

    function startProEdit() {
        setProEditing(true);
        setProSuccess(false);
    }

    async function handleProSave(e: FormEvent) {
        e.preventDefault();
        setProSaving(true);
        try {
            await apiPatch(`/directory/profile/${userId}`, proForm);
            const updatedUser = { ...user, ...proForm };
            setUser(updatedUser);
            setProEditing(false);
            setProSuccess(true);
            showToast("Profil professionnel mis à jour !");
            setTimeout(() => setProSuccess(false), 3000);
        } catch {
            showToast("Erreur lors de la sauvegarde du profil pro.", "error");
        } finally {
            setProSaving(false);
        }
    }

    async function addSkill() {
        if (!newSkill.trim()) return;
        try {
            const updated = await apiPost(`/directory/skills/user/${userId}`, {
                name: newSkill.trim(),
                category: newSkillCategory,
            });
            setSkills(updated as DirectorySkill[]);
            setNewSkill("");
            showToast("Compétence ajoutée !");
        } catch {
            showToast("Erreur lors de l'ajout de la compétence.", "error");
        }
    }

    async function removeSkill(skillId: string) {
        try {
            const updated = await apiDelete(`/directory/skills/user/${userId}/${skillId}`);
            setSkills(updated as DirectorySkill[]);
        } catch {
            showToast("Erreur lors de la suppression.", "error");
        }
    }

    // Family handlers
    function startFamilyEdit() {
        setFamilyEditing(true);
    }

    async function handleFamilySave() {
        setFamilySaving(true);
        try {
            // Diff parents
            const toRemoveParents = initialParentIds.filter((pid) => !familyParentIds.includes(pid));
            const toAddParents = familyParentIds.filter((pid) => !initialParentIds.includes(pid));

            for (const pid of toRemoveParents) {
                const linkId = parentLinkIds[pid];
                if (linkId) await apiDelete(`/family-links/${linkId}`);
            }
            for (const pid of toAddParents) {
                await apiPost("/family-links", { fromUserId: pid, toUserId: userId, relationType: "PARENT" });
            }

            // Diff spouse
            if (familySpouseId !== initialSpouseId) {
                if (initialSpouseLinkId) {
                    await apiDelete(`/family-links/${initialSpouseLinkId}`);
                }
                if (familySpouseId) {
                    await apiPost("/family-links", { fromUserId: userId, toUserId: familySpouseId, relationType: "SPOUSE" });
                }
            }

            // Reload links
            const data = await apiGet(`/family-links/user/${userId}`);
            const links = data as FamilyLinkResolved[];
            setFamilyLinks(links);
            const pIds = links.filter((l) => l.resolvedType === "CHILD").map((l) => l.relatedUser.id);
            const pLinkMap: Record<string, string> = {};
            links.filter((l) => l.resolvedType === "CHILD").forEach((l) => { pLinkMap[l.relatedUser.id] = l.id; });
            setFamilyParentIds(pIds);
            setInitialParentIds(pIds);
            setParentLinkIds(pLinkMap);
            const spLink = links.find((l) => l.resolvedType === "SPOUSE");
            setFamilySpouseId(spLink?.relatedUser?.id || "");
            setInitialSpouseId(spLink?.relatedUser?.id || "");
            setInitialSpouseLinkId(spLink?.id || "");

            setFamilyEditing(false);
            showToast("Liens familiaux mis à jour !");
        } catch {
            showToast("Erreur lors de la sauvegarde des liens familiaux.", "error");
        } finally {
            setFamilySaving(false);
        }
    }

    function cancelFamilyEdit() {
        setFamilyParentIds(initialParentIds);
        setFamilySpouseId(initialSpouseId);
        setFamilyEditing(false);
    }

    const parentLinks = familyLinks.filter((l) => l.resolvedType === "CHILD");
    const childLinks = familyLinks.filter((l) => l.resolvedType === "PARENT");
    const spouseLink = familyLinks.find((l) => l.resolvedType === "SPOUSE");

    return (
        <div className="max-w-5xl mx-auto space-y-6 relative min-h-[600px]">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-4 z-10 p-2 bg-slate-900/50 rounded-full text-gray-400 hover:text-white transition-colors border border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 backdrop-blur-md border text-sm px-5 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top duration-300 ${toast.type === "error"
                    ? "bg-red-500/20 border-red-500/30 text-red-300"
                    : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    }`}>
                    {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* ── HEADER SECTION ── */}
            <div className="relative mb-6">
                {/* Banner/Background */}
                <div className="h-48 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-white/5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                </div>

                {/* Profile Info Overlay */}
                <div className="absolute bottom-0 left-0 w-full px-8 pb-6 flex items-end justify-between">
                    <div className="flex items-end gap-6">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-2xl bg-slate-900 p-1.5 -mb-4 shadow-2xl shadow-black/50 ring-1 ring-white/10">
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold uppercase shadow-inner">
                                {initials}
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="mb-1">
                            <h1 className="text-3xl font-bold text-white drop-shadow-md">{fullName}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER}`}>
                                    <Shield className="w-3 h-3" />
                                    {ROLE_LABELS[user.role] || user.role}
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    {user.email}
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    Membre depuis {new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mb-1">
                        {isEditable && !editing && (
                            <button
                                onClick={startEdit}
                                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Modifier
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── TABS NAVIGATION ── */}
            <div className="flex items-center gap-2 mb-8 border-b border-white/10 px-4">
                {[
                    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
                    { id: "professional", label: "Carrière & Compétences", icon: Briefcase },
                    { id: "family", label: "Famille", icon: Heart },
                    { id: "network", label: "Réseau & Finances", icon: Network },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                            ${activeTab === tab.id ? "text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg"}
                        `}
                    >
                        {/* Active Line indicator */}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_-2px_8px_rgba(59,130,246,0.5)]" />
                        )}
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-400" : "text-gray-500"}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── VISIBLE CONTENT ── */}
            <div className="min-h-[400px]">
                {/* === OVERVIEW TAB === */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <GlassCard>
                                <div className="flex items-center justify-between mb-5">
                                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        Informations personnelles
                                    </h4>
                                    {isEditable && !editing && (
                                        <button
                                            onClick={startEdit}
                                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Modifier
                                        </button>
                                    )}
                                </div>

                                {editing ? (
                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <GlassInput
                                                label="Prénom"
                                                placeholder="Votre prénom"
                                                icon={<User className="w-4 h-4" />}
                                                value={form.firstName}
                                                onChange={(e) =>
                                                    setForm((p) => ({ ...p, firstName: e.target.value }))
                                                }
                                            />
                                            <GlassInput
                                                label="Nom"
                                                placeholder="Votre nom"
                                                icon={<User className="w-4 h-4" />}
                                                value={form.lastName}
                                                onChange={(e) =>
                                                    setForm((p) => ({ ...p, lastName: e.target.value }))
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <GlassButton type="submit" isLoading={saving} icon={<Check className="w-4 h-4" />}>
                                                Enregistrer
                                            </GlassButton>
                                            <button
                                                type="button"
                                                onClick={() => setEditing(false)}
                                                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between py-2.5 border-b border-white/5">
                                            <span className="text-sm text-gray-400">Prénom</span>
                                            <span className="text-sm text-white font-medium">
                                                {user.firstName || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2.5 border-b border-white/5">
                                            <span className="text-sm text-gray-400">Nom</span>
                                            <span className="text-sm text-white font-medium">
                                                {user.lastName || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2.5 border-b border-white/5">
                                            <span className="text-sm text-gray-400">Email</span>
                                            <span className="text-sm text-white font-medium">
                                                {user.email}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2.5">
                                            <span className="text-sm text-gray-400">Rôle</span>
                                            <span className="text-sm text-white font-medium">
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <GlassCard>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Statut</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-white font-medium">Compte Actif</span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${proForm.availableForMentoring ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-gray-500"}`}>
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Mentorat</p>
                                            <p className="text-xs text-gray-400">
                                                {proForm.availableForMentoring ? "Disponible pour aider" : "Non disponible"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                )}

                {/* === PROFESSIONAL TAB === */}
                {activeTab === "professional" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <GlassCard>
                                <div className="flex items-center justify-between mb-5">
                                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-indigo-400" />
                                        Profil professionnel
                                    </h4>
                                    {isEditable && !proEditing && (
                                        <button onClick={startProEdit}
                                            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                                            <Pencil className="w-3.5 h-3.5" />
                                            Modifier
                                        </button>
                                    )}
                                </div>

                                {proEditing ? (
                                    <form onSubmit={handleProSave} className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <ProSelect label="Situation professionnelle" value={proForm.professionalStatus}
                                                onChange={(v) => setProForm({ ...proForm, professionalStatus: v })} options={PRO_STATUS_LABELS} />
                                            <ProInput label="Métier / Poste" value={proForm.jobTitle} placeholder="Ex: Ingénieur logiciel"
                                                onChange={(v) => setProForm({ ...proForm, jobTitle: v })} />
                                            <ProSelect label="Secteur d'activité" value={proForm.industrySector}
                                                onChange={(v) => setProForm({ ...proForm, industrySector: v })} options={SECTOR_LABELS} />
                                            <ProInput label="Employeur" value={proForm.employer} placeholder="Nom de l'entreprise"
                                                onChange={(v) => setProForm({ ...proForm, employer: v })} />
                                            <ProSelect label="Niveau d'études" value={proForm.educationLevel}
                                                onChange={(v) => setProForm({ ...proForm, educationLevel: v })} options={EDUCATION_LABELS} />
                                            <ProInput label="Domaine d'études" value={proForm.fieldOfStudy} placeholder="Ex: Informatique, Médecine…"
                                                onChange={(v) => setProForm({ ...proForm, fieldOfStudy: v })} />
                                        </div>

                                        {/* Mentoring */}
                                        <label className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 cursor-pointer hover:bg-amber-500/10 transition-colors">
                                            <input type="checkbox" checked={proForm.availableForMentoring}
                                                onChange={(e) => setProForm({ ...proForm, availableForMentoring: e.target.checked })}
                                                className="rounded accent-amber-500" />
                                            <div>
                                                <p className="text-sm text-white font-medium">🤝 Disponible pour le mentorat</p>
                                                <p className="text-xs text-gray-400">Accepte d&apos;accompagner les membres dans leur parcours</p>
                                            </div>
                                        </label>

                                        {/* Visibility */}
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-400 flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Visibilité du profil
                                            </label>
                                            <select value={proForm.profileVisibility}
                                                onChange={(e) => setProForm({ ...proForm, profileVisibility: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                                                {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
                                                    <option key={k} value={k} className="bg-slate-800">{v}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <GlassButton type="submit" isLoading={proSaving} icon={<Check className="w-4 h-4" />}>
                                                Enregistrer
                                            </GlassButton>
                                            <button type="button" onClick={() => setProEditing(false)}
                                                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2">
                                                <X className="w-4 h-4" />
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <ProField label="Situation" value={PRO_STATUS_LABELS[proForm.professionalStatus] || proForm.professionalStatus} />
                                        <ProField label="Métier / Poste" value={proForm.jobTitle} />
                                        <ProField label="Secteur" value={SECTOR_LABELS[proForm.industrySector] || proForm.industrySector} />
                                        <ProField label="Employeur" value={proForm.employer} />
                                        <ProField label="Niveau d'études" value={EDUCATION_LABELS[proForm.educationLevel] || proForm.educationLevel} />
                                        <ProField label="Domaine d'études" value={proForm.fieldOfStudy} />
                                        <ProField label="Mentorat" value={proForm.availableForMentoring ? "🤝 Disponible" : "Non disponible"} />
                                        <ProField label="Visibilité" value={VISIBILITY_LABELS[proForm.profileVisibility] || proForm.profileVisibility} />
                                    </div>
                                )}
                            </GlassCard>
                        </div>

                        <div className="md:col-span-1">
                            {/* ── Skills ── */}
                            <GlassCard className="h-full">
                                <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    Compétences
                                </h4>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {skills.map((s) => (
                                        <span key={s.id}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${SKILL_CATEGORY_COLORS[s.category || "OTHER"]}`}>
                                            {s.name}
                                            {isEditable && (
                                                <button onClick={() => removeSkill(s.id)}
                                                    className="hover:text-red-400 transition-colors ml-0.5 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                    {skills.length === 0 && (
                                        <p className="text-xs text-gray-500 italic">Aucune compétence ajoutée.</p>
                                    )}
                                </div>

                                {isEditable && (
                                    <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                                        <input type="text" placeholder="Ajouter une compétence…"
                                            value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
                                        <div className="flex gap-2">
                                            <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                                                {Object.entries(SKILL_CATEGORY_LABELS).map(([k, v]) => (
                                                    <option key={k} value={k} className="bg-slate-800">{v}</option>
                                                ))}
                                            </select>
                                            <button onClick={addSkill}
                                                className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors cursor-pointer">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>
                )}

                {/* === FAMILY TAB === */}
                {activeTab === "family" && (
                    <div className="max-w-2xl mx-auto">
                        <GlassCard>
                            <div className="flex items-center justify-between mb-5">
                                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                    <GitBranch className="w-4 h-4 text-emerald-400" />
                                    Famille
                                </h4>
                                {isEditable && !familyEditing && (
                                    <button onClick={startFamilyEdit}
                                        className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                                        <Pencil className="w-3.5 h-3.5" />
                                        Modifier
                                    </button>
                                )}
                            </div>

                            {familyEditing ? (
                                <div className="space-y-4">
                                    {/* Parent selector */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                                            Parents
                                            {familyParentIds.length > 0 && (
                                                <span className="text-emerald-400 ml-1 text-[10px]">
                                                    — {familyParentIds.length} sélectionné(s)
                                                </span>
                                            )}
                                        </label>
                                        <select
                                            multiple
                                            value={familyParentIds}
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                                                if (selected.length > 2) return;
                                                setFamilyParentIds(selected);
                                            }}
                                            className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[80px]"
                                        >
                                            {allMembers.map((m) => (
                                                <option key={m.id} value={m.id} className="bg-slate-800">
                                                    {m.firstName} {m.lastName}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-1 ml-1">Ctrl+clic pour sélectionner (max 2)</p>
                                    </div>

                                    {/* Spouse selector */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                                            <Heart className="w-3.5 h-3.5 inline mr-1 text-pink-400" />
                                            Conjoint(e)
                                        </label>
                                        <select
                                            value={familySpouseId}
                                            onChange={(e) => setFamilySpouseId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                                        >
                                            <option value="" className="bg-slate-800">— Aucun(e) —</option>
                                            {allMembers.map((m) => (
                                                <option key={m.id} value={m.id} className="bg-slate-800">
                                                    {m.firstName} {m.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <GlassButton onClick={handleFamilySave} isLoading={familySaving} icon={<Check className="w-4 h-4" />}>
                                            Enregistrer
                                        </GlassButton>
                                        <button type="button" onClick={cancelFamilyEdit}
                                            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2">
                                            <X className="w-4 h-4" />
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Parents */}
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Parents</span>
                                        {parentLinks.length > 0 ? (
                                            <div className="mt-1.5 space-y-1.5">
                                                {parentLinks.map((l) => (
                                                    <div key={l.id} className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                                                        <div className="w-7 h-7 rounded-full bg-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                                                            {(l.relatedUser.firstName?.[0] || "") + (l.relatedUser.lastName?.[0] || "")}
                                                        </div>
                                                        <span className="text-sm text-white font-medium">
                                                            {l.relatedUser.firstName} {l.relatedUser.lastName}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic mt-1">Aucun parent déclaré</p>
                                        )}
                                    </div>

                                    {/* Spouse */}
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Heart className="w-3 h-3 text-pink-400" />
                                            Conjoint(e)
                                        </span>
                                        {spouseLink ? (
                                            <div className="mt-1.5 flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">
                                                <div className="w-7 h-7 rounded-full bg-pink-500/30 flex items-center justify-center text-xs font-bold text-pink-300">
                                                    {(spouseLink.relatedUser.firstName?.[0] || "") + (spouseLink.relatedUser.lastName?.[0] || "")}
                                                </div>
                                                <span className="text-sm text-white font-medium">
                                                    {spouseLink.relatedUser.firstName} {spouseLink.relatedUser.lastName}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic mt-1">Aucun conjoint déclaré</p>
                                        )}
                                    </div>

                                    {/* Children (read-only) */}
                                    {childLinks.length > 0 && (
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">Enfants</span>
                                            <div className="mt-1.5 space-y-1.5">
                                                {childLinks.map((l) => (
                                                    <div key={l.id} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                                                        <div className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
                                                            {(l.relatedUser.firstName?.[0] || "") + (l.relatedUser.lastName?.[0] || "")}
                                                        </div>
                                                        <span className="text-sm text-white font-medium">
                                                            {l.relatedUser.firstName} {l.relatedUser.lastName}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {parentLinks.length === 0 && !spouseLink && childLinks.length === 0 && (
                                        <p className="text-xs text-gray-500 italic">
                                            Aucun lien familial déclaré.
                                        </p>
                                    )}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                )}

                {/* === NETWORK TAB === */}
                {activeTab === "network" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Secondary Associations */}
                        <GlassCard>
                            <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                                <Network className="w-4 h-4 text-purple-400" />
                                Antennes rattachées
                            </h4>
                            {secondaryAssociations.length > 0 ? (
                                <div className="space-y-3">
                                    {secondaryAssociations.map((sa) => (
                                        <div key={sa.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-xs font-bold text-purple-300">
                                                {sa.association.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{sa.association.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {sa.association.address_city && (
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                                            <MapPin className="w-2.5 h-2.5" />
                                                            {sa.association.address_city}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-500">
                                                        Depuis {new Date(sa.joinedAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 shrink-0">
                                                {sa.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Network className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <p className="text-sm text-gray-400">Aucune autre antenne rattachée</p>
                                </div>
                            )}
                        </GlassCard>

                        {/* Financial History */}
                        <GlassCard>
                            <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                                <CreditCard className="w-4 h-4 text-blue-400" />
                                Historique Financier
                            </h4>

                            {feesLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : fees.length === 0 ? (
                                <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                                    <p className="text-xs text-gray-500">Aucune cotisation enregistrée.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-auto pr-1">
                                    {fees.map((fee) => (
                                        <div key={fee.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-3">
                                                {fee.status === "PAID" ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                                ) : fee.status === "OVERDUE" ? (
                                                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                                ) : (
                                                    <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                                                )}
                                                <div>
                                                    <p className="text-xs font-medium text-white">{fee.label}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {fee.paidAt
                                                            ? `Payé le ${new Date(fee.paidAt).toLocaleDateString("fr-FR")}`
                                                            : `Échéance: ${new Date(fee.dueDate).toLocaleDateString("fr-FR")}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium ${fee.status === "PAID" ? "text-emerald-400" : "text-yellow-400"
                                                }`}>
                                                {fee.amount.toLocaleString()} XAF
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProField({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
            <span className="text-sm text-gray-400">{label}</span>
            <span className="text-sm text-white font-medium text-right">{value || "—"}</span>
        </div>
    );
}

function ProSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: Record<string, string>;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-gray-400 ml-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                <option value="" className="bg-slate-800">— Non renseigné —</option>
                {Object.entries(options).map(([k, v]) => (
                    <option key={k} value={k} className="bg-slate-800">{v}</option>
                ))}
            </select>
        </div>
    );
}

function ProInput({ label, value, placeholder, onChange }: {
    label: string; value: string; placeholder?: string; onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-gray-400 ml-1">{label}</label>
            <input type="text" value={value} placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
        </div>
    );
}
