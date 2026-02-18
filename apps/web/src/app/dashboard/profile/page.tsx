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
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import { useAuth } from "@/hooks/useAuth";
import { apiPatch, apiGet, apiPost, apiDelete } from "@/lib/api";
import {
    PRO_STATUS_LABELS,
    SECTOR_LABELS,
    EDUCATION_LABELS,
    SKILL_CATEGORY_COLORS,
    SKILL_CATEGORY_LABELS,
    type DirectorySkill,
} from "@/components/directory/constants";

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

export default function ProfilePage() {
    const { user } = useAuth();
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

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    function showToast(message: string, type: "success" | "error" = "success") {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    // Load pro data from localStorage (has full user including pro fields)
    useEffect(() => {
        if (!user) return;
        try {
            const raw = localStorage.getItem("user");
            if (raw) {
                const fullUser = JSON.parse(raw);
                setProForm({
                    professionalStatus: fullUser.professionalStatus || "",
                    jobTitle: fullUser.jobTitle || "",
                    industrySector: fullUser.industrySector || "",
                    employer: fullUser.employer || "",
                    educationLevel: fullUser.educationLevel || "",
                    fieldOfStudy: fullUser.fieldOfStudy || "",
                    availableForMentoring: !!fullUser.availableForMentoring,
                    profileVisibility: fullUser.profileVisibility || "MEMBERS",
                });
            }
        } catch { /* ignored */ }
        // Load skills
        apiGet(`/directory/skills/user/${user.id}`)
            .then((data) => setSkills(data as DirectorySkill[]))
            .catch(() => setSkills([]));
    }, [user]);

    if (!user) return null;

    const initials =
        (user.firstName?.[0] || "") + (user.lastName?.[0] || user.email[0] || "");
    const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    function startEdit() {
        setForm({
            firstName: user!.firstName || "",
            lastName: user!.lastName || "",
        });
        setEditing(true);
        setSuccess(false);
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await apiPatch(`/users/${user!.id}`, form);
            const updatedUser = { ...user, ...form };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            window.location.reload();
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
            await apiPatch(`/directory/profile/${user!.id}`, proForm);
            // Update localStorage
            const updatedUser = { ...user, ...proForm };
            localStorage.setItem("user", JSON.stringify(updatedUser));
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
            const updated = await apiPost(`/directory/skills/user/${user!.id}`, {
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
            const updated = await apiDelete(`/directory/skills/user/${user!.id}/${skillId}`);
            setSkills(updated as DirectorySkill[]);
        } catch {
            showToast("Erreur lors de la suppression.", "error");
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
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

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-400" />
                Mon Espace
            </h2>

            {/* Profile Card */}
            <GlassCard className="!p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg shadow-blue-500/20">
                        {initials}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">{fullName}</h3>
                        <div className="flex items-center justify-center gap-2 mt-1.5 text-gray-400 text-sm">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER
                            }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        {ROLE_LABELS[user.role] || user.role}
                    </span>
                </div>
            </GlassCard>

            {/* Info & Edit */}
            <GlassCard>
                <div className="flex items-center justify-between mb-5">
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        Informations personnelles
                    </h4>
                    {!editing && (
                        <button
                            onClick={startEdit}
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                        </button>
                    )}
                </div>

                {success && (
                    <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg p-3">
                        <Check className="w-4 h-4" />
                        Profil mis à jour avec succès !
                    </div>
                )}

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

            {/* ── Professional Profile ── */}
            <GlassCard>
                <div className="flex items-center justify-between mb-5">
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        Mon profil professionnel
                    </h4>
                    {!proEditing && (
                        <button onClick={startProEdit}
                            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                        </button>
                    )}
                </div>

                {proSuccess && (
                    <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg p-3">
                        <Check className="w-4 h-4" />
                        Profil professionnel mis à jour !
                    </div>
                )}

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

            {/* ── Skills ── */}
            <GlassCard>
                <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-amber-400" />
                    Mes compétences
                </h4>

                <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((s) => (
                        <span key={s.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${SKILL_CATEGORY_COLORS[s.category || "OTHER"]}`}>
                            {s.name}
                            <button onClick={() => removeSkill(s.id)}
                                className="hover:text-red-400 transition-colors ml-0.5 cursor-pointer">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {skills.length === 0 && (
                        <p className="text-xs text-gray-500 italic">Aucune compétence ajoutée. Ajoutez vos compétences pour apparaître dans l&apos;annuaire !</p>
                    )}
                </div>

                <div className="flex gap-2">
                    <input type="text" placeholder="Ajouter une compétence…"
                        value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
                    <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                        {Object.entries(SKILL_CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k} className="bg-slate-800">{v}</option>
                        ))}
                    </select>
                    <button onClick={addSkill}
                        className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors cursor-pointer">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}

/* ─── Sub-components ─── */
function ProField({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between py-2.5 border-b border-white/5">
            <span className="text-sm text-gray-400">{label}</span>
            <span className="text-sm text-white font-medium">{value || "—"}</span>
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
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                <option value="" className="bg-slate-800">— Non renseigné —</option>
                {Object.entries(options).map(([k, v]) => (
                    <option key={k} value={k} className="bg-slate-800">{v}</option>
                ))}
            </select>
        </div>
    );
}

function ProInput({ label, value, placeholder, onChange }: {
    label: string; value: string; placeholder: string; onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-gray-400">{label}</label>
            <input type="text" value={value} placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
        </div>
    );
}
