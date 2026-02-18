"use client";

import { useState, useEffect } from "react";
import { X, Calendar, CreditCard, MapPin, Phone, Users as UsersIcon, Mail, CheckCircle, Clock, XCircle, Briefcase, Award, Plus, GraduationCap, Building2 } from "lucide-react";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import {
    PRO_STATUS_LABELS,
    SECTOR_LABELS,
    EDUCATION_LABELS,
    SKILL_CATEGORY_COLORS,
    SKILL_CATEGORY_LABELS,
} from "@/components/directory/constants";

interface Member {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
    status: string;
    residence_city: string | null;
    residence_country: string | null;
    family_branch: string | null;
    birth_date: string | null;
    membership_date: string | null;
    createdAt: string;
    // Professional fields
    professionalStatus?: string | null;
    jobTitle?: string | null;
    industrySector?: string | null;
    employer?: string | null;
    educationLevel?: string | null;
    fieldOfStudy?: string | null;
    availableForMentoring?: boolean;
}

interface Role {
    id: string;
    name: string;
    slug: string;
    color: string;
}

interface Fee {
    id: string;
    label: string;
    amount: number;
    status: string;
    dueDate: string;
    paidAt: string | null;
}

interface MemberSkill {
    id: string;
    name: string;
    category: string | null;
    level: string | null;
}

const FALLBACK_ROLE_COLORS: Record<string, string> = {
    ADMIN: "#8b5cf6",
    PRESIDENT: "#10b981",
    TREASURER: "#f59e0b",
    SECRETARY: "#06b6d4",
    MEMBER: "#3b82f6",
    CHIEF: "#d97706",
    NOTABLE: "#10b981",
    ELDER: "#f59e0b",
};

const COUNTRY_FLAGS: Record<string, string> = {
    FR: "🇫🇷", CM: "🇨🇲", US: "🇺🇸", CA: "🇨🇦", DE: "🇩🇪", BE: "🇧🇪",
    GB: "🇬🇧", CH: "🇨🇭", IT: "🇮🇹", ES: "🇪🇸", CI: "🇨🇮", GA: "🇬🇦",
    SN: "🇸🇳", CG: "🇨🇬", CD: "🇨🇩", NG: "🇳🇬", GQ: "🇬🇶", TD: "🇹🇩",
};

interface MemberSlideOverProps {
    member: Member | null;
    roles?: Role[];
    onClose: () => void;
}

export default function MemberSlideOver({
    member,
    roles = [],
    onClose,
}: MemberSlideOverProps) {
    const [activeTab, setActiveTab] = useState<"info" | "pro">("info");
    const [fees, setFees] = useState<Fee[]>([]);
    const [feesLoading, setFeesLoading] = useState(false);

    // Pro tab state
    const [skills, setSkills] = useState<MemberSkill[]>([]);
    const [proEditing, setProEditing] = useState(false);
    const [proForm, setProForm] = useState({
        professionalStatus: "", jobTitle: "", industrySector: "",
        employer: "", educationLevel: "", fieldOfStudy: "",
        availableForMentoring: false,
    });
    const [proSaving, setProSaving] = useState(false);
    const [newSkill, setNewSkill] = useState("");
    const [newSkillCategory, setNewSkillCategory] = useState("TECHNICAL");

    useEffect(() => {
        if (member) {
            setActiveTab("info");
            setProEditing(false);
            // Load fees
            setFeesLoading(true);
            apiGet(`/finance/fees/user/${member.id}`)
                .then((data) => setFees(data as Fee[]))
                .catch(() => setFees([]))
                .finally(() => setFeesLoading(false));
            // Load skills
            apiGet(`/directory/skills/user/${member.id}`)
                .then((data) => setSkills(data as MemberSkill[]))
                .catch(() => setSkills([]));
            // Init pro form
            setProForm({
                professionalStatus: member.professionalStatus || "",
                jobTitle: member.jobTitle || "",
                industrySector: member.industrySector || "",
                employer: member.employer || "",
                educationLevel: member.educationLevel || "",
                fieldOfStudy: member.fieldOfStudy || "",
                availableForMentoring: member.availableForMentoring ?? false,
            });
        } else {
            setFees([]);
            setSkills([]);
        }
    }, [member]);

    if (!member) return null;

    const getRoleColor = (slug: string) => {
        const role = roles.find((r) => r.slug === slug);
        return role?.color || FALLBACK_ROLE_COLORS[slug] || "#6b7280";
    };

    const getRoleLabel = (slug: string) => {
        const role = roles.find((r) => r.slug === slug);
        return role?.name || slug;
    };

    const initials =
        (member.firstName?.[0] || "") + (member.lastName?.[0] || member.email[0]);
    const fullName =
        [member.firstName, member.lastName].filter(Boolean).join(" ") ||
        member.email;

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    const joinDate = formatDate(member.createdAt);
    const membershipDate = member.membership_date ? formatDate(member.membership_date) : null;
    const birthDate = member.birth_date ? formatDate(member.birth_date) : null;

    const roleColor = getRoleColor(member.role);

    const countryFlag = member.residence_country
        ? COUNTRY_FLAGS[member.residence_country.toUpperCase()] || ""
        : "";

    const location = [member.residence_city, member.residence_country ? `${countryFlag} ${member.residence_country}` : ""]
        .filter(Boolean)
        .join(", ");

    // Financial stats
    const paidFees = fees.filter((f) => f.status === "PAID").length;
    const pendingFees = fees.filter((f) => f.status !== "PAID").length;
    const totalPaid = fees
        .filter((f) => f.status === "PAID")
        .reduce((sum, f) => sum + f.amount, 0);

    async function savePro() {
        if (!member) return;
        setProSaving(true);
        try {
            await apiPatch(`/directory/profile/${member.id}`, proForm);
            setProEditing(false);
        } catch { /* silent */ }
        finally { setProSaving(false); }
    }

    async function addSkill() {
        if (!member || !newSkill.trim()) return;
        try {
            const updated = await apiPost(`/directory/skills/user/${member.id}`, {
                name: newSkill.trim(),
                category: newSkillCategory,
            });
            setSkills(updated as MemberSkill[]);
            setNewSkill("");
        } catch { /* silent */ }
    }

    async function removeSkill(skillId: string) {
        if (!member) return;
        try {
            const updated = await apiDelete(`/directory/skills/user/${member.id}/${skillId}`);
            setSkills(updated as MemberSkill[]);
        } catch { /* silent */ }
    }

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md backdrop-blur-md bg-slate-900/80 border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">
                        Fiche Membre
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${activeTab === "info"
                            ? "text-indigo-400 border-b-2 border-indigo-500"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Informations
                    </button>
                    <button
                        onClick={() => setActiveTab("pro")}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${activeTab === "pro"
                            ? "text-indigo-400 border-b-2 border-indigo-500"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Profil Pro
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Avatar & Identity (both tabs) */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
                                boxShadow: `0 10px 25px ${roleColor}33`,
                            }}
                        >
                            {initials}
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white">
                                {fullName}
                            </h4>
                            <p className="text-sm text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {member.email}
                            </p>
                        </div>
                        <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                            style={{
                                backgroundColor: `${roleColor}20`,
                                color: roleColor,
                                borderColor: `${roleColor}50`,
                            }}
                        >
                            {getRoleLabel(member.role)}
                        </span>
                    </div>

                    {/* ── TAB: INFO ── */}
                    {activeTab === "info" && (
                        <>
                            {/* Quick Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Status */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Statut</p>
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    member.status === "ACTIVE" ? "#10b981"
                                                        : member.status === "SUSPENDED" ? "#ef4444"
                                                            : "#eab308",
                                            }}
                                        />
                                        <span className="text-sm font-medium text-white">
                                            {member.status === "ACTIVE" ? "Actif"
                                                : member.status === "SUSPENDED" ? "Suspendu"
                                                    : "En attente"}
                                        </span>
                                    </div>
                                </div>

                                {/* Inscription */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Inscription</p>
                                    <p className="text-sm font-medium text-white">{joinDate}</p>
                                </div>

                                {/* Phone */}
                                {member.phone && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Téléphone</p>
                                        <p className="text-sm font-medium text-white flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            {member.phone}
                                        </p>
                                    </div>
                                )}

                                {/* Location */}
                                {location && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Résidence</p>
                                        <p className="text-sm font-medium text-white flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            {location}
                                        </p>
                                    </div>
                                )}

                                {/* Birth date */}
                                {birthDate && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Naissance</p>
                                        <p className="text-sm font-medium text-white flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {birthDate}
                                        </p>
                                    </div>
                                )}

                                {/* Membership date */}
                                {membershipDate && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Adhésion</p>
                                        <p className="text-sm font-medium text-white flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {membershipDate}
                                        </p>
                                    </div>
                                )}

                                {/* Family branch */}
                                {member.family_branch && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Branche familiale</p>
                                        <p className="text-sm font-medium text-white flex items-center gap-1">
                                            <UsersIcon className="w-3 h-3 text-gray-400" />
                                            {member.family_branch}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Financial History */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-blue-400" />
                                    Historique Financier
                                </h5>

                                {feesLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : fees.length === 0 ? (
                                    <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                                        <p className="text-xs text-gray-500">
                                            Aucune cotisation enregistrée pour ce membre.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Quick financial stats */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                                                <p className="text-lg font-bold text-emerald-400">{paidFees}</p>
                                                <p className="text-[10px] text-emerald-300/70">Payées</p>
                                            </div>
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                                                <p className="text-lg font-bold text-yellow-400">{pendingFees}</p>
                                                <p className="text-[10px] text-yellow-300/70">En attente</p>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                                                <p className="text-lg font-bold text-blue-400">{totalPaid.toLocaleString()}</p>
                                                <p className="text-[10px] text-blue-300/70">XAF payés</p>
                                            </div>
                                        </div>

                                        {/* Fee list */}
                                        <div className="space-y-2 max-h-48 overflow-auto">
                                            {fees.map((fee) => (
                                                <div
                                                    key={fee.id}
                                                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-2">
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
                                                    <span className={`text-sm font-medium ${fee.status === "PAID" ? "text-emerald-400" : "text-yellow-400"}`}>
                                                        {fee.amount.toLocaleString()} XAF
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── TAB: PRO ── */}
                    {activeTab === "pro" && (
                        <>
                            {/* Professional info display / edit */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-indigo-400" />
                                        Informations Professionnelles
                                    </h5>
                                    {!proEditing && (
                                        <button onClick={() => setProEditing(true)}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                                            Modifier
                                        </button>
                                    )}
                                </div>

                                {proEditing ? (
                                    <div className="space-y-3">
                                        <ProSelect label="Situation" value={proForm.professionalStatus}
                                            onChange={(v) => setProForm({ ...proForm, professionalStatus: v })}
                                            options={PRO_STATUS_LABELS} />
                                        <ProInput label="Métier / Poste" value={proForm.jobTitle}
                                            onChange={(v) => setProForm({ ...proForm, jobTitle: v })} />
                                        <ProSelect label="Secteur" value={proForm.industrySector}
                                            onChange={(v) => setProForm({ ...proForm, industrySector: v })}
                                            options={SECTOR_LABELS} />
                                        <ProInput label="Employeur" value={proForm.employer}
                                            onChange={(v) => setProForm({ ...proForm, employer: v })} />
                                        <ProSelect label="Niveau d'études" value={proForm.educationLevel}
                                            onChange={(v) => setProForm({ ...proForm, educationLevel: v })}
                                            options={EDUCATION_LABELS} />
                                        <ProInput label="Domaine d'études" value={proForm.fieldOfStudy}
                                            onChange={(v) => setProForm({ ...proForm, fieldOfStudy: v })} />

                                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                            <input type="checkbox" checked={proForm.availableForMentoring}
                                                onChange={(e) => setProForm({ ...proForm, availableForMentoring: e.target.checked })}
                                                className="rounded accent-amber-500" />
                                            🤝 Disponible pour le mentorat
                                        </label>

                                        <div className="flex gap-2 pt-2">
                                            <button onClick={savePro} disabled={proSaving}
                                                className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-colors cursor-pointer disabled:opacity-50">
                                                {proSaving ? "Sauvegarde…" : "Enregistrer"}
                                            </button>
                                            <button onClick={() => setProEditing(false)}
                                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-colors cursor-pointer">
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <ProField label="Situation" value={PRO_STATUS_LABELS[member.professionalStatus || ""] || member.professionalStatus} />
                                        <ProField label="Métier" value={member.jobTitle} />
                                        <ProField label="Secteur" value={SECTOR_LABELS[member.industrySector || ""] || member.industrySector} />
                                        <ProField label="Employeur" value={member.employer} />
                                        <ProField label="Études" value={EDUCATION_LABELS[member.educationLevel || ""] || member.educationLevel} />
                                        <ProField label="Domaine" value={member.fieldOfStudy} />
                                        <ProField label="Mentorat" value={member.availableForMentoring ? "🤝 Disponible" : "Non disponible"} />
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    Compétences
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((s) => (
                                        <span key={s.id}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${SKILL_CATEGORY_COLORS[s.category || "OTHER"]}`}>
                                            {s.name}
                                            <button onClick={() => removeSkill(s.id)}
                                                className="hover:text-red-400 transition-colors ml-0.5 cursor-pointer">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {skills.length === 0 && (
                                        <p className="text-xs text-gray-500 italic">Aucune compétence ajoutée.</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Nouvelle compétence…"
                                        value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
                                    <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)}
                                        className="bg-white/5 border border-white/10 text-white rounded-lg py-2 px-2 text-xs focus:outline-none">
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
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

/* ─── Small sub-components ─── */
function ProField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs text-white font-medium">{value || "—"}</span>
        </div>
    );
}

function ProSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: Record<string, string>;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-gray-400">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                <option value="" className="bg-slate-800">—</option>
                {Object.entries(options).map(([k, v]) => (
                    <option key={k} value={k} className="bg-slate-800">{v}</option>
                ))}
            </select>
        </div>
    );
}

function ProInput({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-gray-400">{label}</label>
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
        </div>
    );
}
