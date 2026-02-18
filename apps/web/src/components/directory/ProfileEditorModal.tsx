"use client";

import { useState, useEffect, useRef } from "react";
import { Award, Plus, X } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import { apiPatch, apiPost, apiDelete, apiGet } from "@/lib/api";
import {
    DirectoryMember,
    DirectorySkill,
    PRO_STATUS_LABELS,
    SECTOR_LABELS,
    EDUCATION_LABELS,
    SKILL_CATEGORY_COLORS,
    SKILL_CATEGORY_LABELS,
    memberName,
    memberInitials,
} from "./constants";

interface ProfileEditorModalProps {
    member: DirectoryMember | null;
    onClose: () => void;
    onSaved: () => void;
    onError: (msg: string) => void;
}

interface SkillSuggestion {
    id: string;
    name: string;
    category: string | null;
}

export default function ProfileEditorModal({ member, onClose, onSaved, onError }: ProfileEditorModalProps) {
    const [form, setForm] = useState({
        professionalStatus: "",
        jobTitle: "",
        industrySector: "",
        employer: "",
        educationLevel: "",
        fieldOfStudy: "",
        availableForMentoring: false,
    });
    const [saving, setSaving] = useState(false);
    const [skills, setSkills] = useState<DirectorySkill[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [newSkillCategory, setNewSkillCategory] = useState("TECHNICAL");
    const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestRef = useRef<HTMLDivElement>(null);

    // Init form when member changes
    useEffect(() => {
        if (member) {
            setForm({
                professionalStatus: member.professionalStatus || "",
                jobTitle: member.jobTitle || "",
                industrySector: member.industrySector || "",
                employer: member.employer || "",
                educationLevel: member.educationLevel || "",
                fieldOfStudy: member.fieldOfStudy || "",
                availableForMentoring: member.availableForMentoring,
            });
            setSkills(member.skills);
            setNewSkill("");
            setSuggestions([]);
        }
    }, [member]);

    // Auto-completion for skills
    useEffect(() => {
        if (newSkill.length < 2) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const data = await apiGet(`/directory/skills/suggest?q=${encodeURIComponent(newSkill)}`);
                const existing = new Set(skills.map((s) => s.id));
                setSuggestions((data as SkillSuggestion[]).filter((s) => !existing.has(s.id)));
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [newSkill, skills]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function saveProfile() {
        if (!member) return;
        setSaving(true);
        try {
            await apiPatch(`/directory/profile/${member.id}`, form);
            onSaved();
            onClose();
        } catch {
            onError("Erreur lors de la sauvegarde du profil.");
        } finally {
            setSaving(false);
        }
    }

    async function addSkill(name?: string, category?: string) {
        if (!member) return;
        const skillName = name || newSkill.trim();
        if (!skillName) return;
        try {
            const updated = await apiPost(`/directory/skills/user/${member.id}`, {
                name: skillName,
                category: category || newSkillCategory,
            });
            setSkills(updated as DirectorySkill[]);
            setNewSkill("");
            setSuggestions([]);
            setShowSuggestions(false);
        } catch {
            onError("Erreur lors de l'ajout de la compétence.");
        }
    }

    async function removeSkill(skillId: string) {
        if (!member) return;
        try {
            const updated = await apiDelete(`/directory/skills/user/${member.id}/${skillId}`);
            setSkills(updated as DirectorySkill[]);
        } catch {
            onError("Erreur lors de la suppression de la compétence.");
        }
    }

    if (!member) return null;

    return (
        <GlassModal open={!!member} onClose={onClose} title="Profil professionnel">
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold uppercase">
                        {memberInitials(member)}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{memberName(member)}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                </div>

                {/* Form fields */}
                <div className="grid sm:grid-cols-2 gap-3">
                    <FormSelect label="Situation professionnelle" value={form.professionalStatus}
                        onChange={(v) => setForm({ ...form, professionalStatus: v })} options={PRO_STATUS_LABELS} />
                    <FormInput label="Métier / Poste" value={form.jobTitle} placeholder="Ex: Ingénieur logiciel"
                        onChange={(v) => setForm({ ...form, jobTitle: v })} />
                    <FormSelect label="Secteur d'activité" value={form.industrySector}
                        onChange={(v) => setForm({ ...form, industrySector: v })} options={SECTOR_LABELS} />
                    <FormInput label="Employeur" value={form.employer} placeholder="Nom de l'entreprise"
                        onChange={(v) => setForm({ ...form, employer: v })} />
                    <FormSelect label="Niveau d'études" value={form.educationLevel}
                        onChange={(v) => setForm({ ...form, educationLevel: v })} options={EDUCATION_LABELS} />
                    <FormInput label="Domaine d'études" value={form.fieldOfStudy} placeholder="Ex: Informatique, Médecine…"
                        onChange={(v) => setForm({ ...form, fieldOfStudy: v })} />
                </div>

                {/* Mentoring toggle */}
                <label className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 cursor-pointer hover:bg-amber-500/10 transition-colors">
                    <input type="checkbox" checked={form.availableForMentoring}
                        onChange={(e) => setForm({ ...form, availableForMentoring: e.target.checked })}
                        className="rounded accent-amber-500" />
                    <div>
                        <p className="text-sm text-white font-medium">🤝 Disponible pour le mentorat</p>
                        <p className="text-xs text-gray-400">Accepte d&apos;accompagner les jeunes dans leur orientation</p>
                    </div>
                </label>

                {/* Skills */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        Compétences
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((s) => (
                            <span key={s.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${SKILL_CATEGORY_COLORS[s.category || "OTHER"]}`}>
                                {s.name}
                                <button onClick={() => removeSkill(s.id)}
                                    className="hover:text-red-400 transition-colors cursor-pointer ml-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {skills.length === 0 && (
                            <p className="text-xs text-gray-500 italic">Aucune compétence ajoutée.</p>
                        )}
                    </div>
                    <div className="flex gap-2 relative" ref={suggestRef}>
                        <div className="relative flex-1">
                            <input type="text" placeholder="Ajouter une compétence…" value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                    {suggestions.map((s) => (
                                        <button key={s.id}
                                            onClick={() => addSkill(s.name, s.category || undefined)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                            <span>{s.name}</span>
                                            {s.category && (
                                                <span className="text-[10px] text-gray-500">{SKILL_CATEGORY_LABELS[s.category] || s.category}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)}
                            className="bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                            {Object.entries(SKILL_CATEGORY_LABELS).map(([k, v]) => (
                                <option key={k} value={k} className="bg-slate-800">{v}</option>
                            ))}
                        </select>
                        <button onClick={() => addSkill()}
                            className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors cursor-pointer">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                        Fermer
                    </button>
                    <GlassButton className="!w-auto px-6" onClick={saveProfile} disabled={saving}>
                        {saving ? "Sauvegarde…" : "Enregistrer le profil"}
                    </GlassButton>
                </div>
            </div>
        </GlassModal>
    );
}

/* ─── Internal sub-components ─── */
function FormSelect({ label, value, onChange, options }: {
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

function FormInput({ label, value, placeholder, onChange }: {
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
