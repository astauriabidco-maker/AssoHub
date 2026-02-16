"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Scale,
    Save,
    Check,
    MessageSquare,
    Network,
    Plus,
    Globe,
    ChevronRight,
    Users,
    Copy,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassModal from "@/components/ui/GlassModal";
import RequirePermission from "@/components/auth/RequirePermission";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

interface ChildAssociation {
    id: string;
    name: string;
    address_city: string | null;
    networkLevel: string;
    is_active: boolean;
    createdAt: string;
    _count?: { users: number };
}

interface ParentAssociation {
    id: string;
    name: string;
    networkLevel: string;
}

interface Association {
    id: string;
    name: string;
    slug: string;
    slogan: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address_street: string | null;
    address_city: string | null;
    address_zip: string | null;
    address_country: string | null;
    legal_form: string | null;
    networkLevel: string;
    parentId: string | null;
    parent: ParentAssociation | null;
    children: ChildAssociation[];
}

const LEGAL_FORMS = [
    "Association loi 1901",
    "Association loi 1908",
    "ONG",
    "Fondation",
    "Coopérative",
    "GIE",
    "Autre",
];

const NETWORK_LEVELS: Record<string, { label: string; color: string; icon: string }> = {
    INTERNATIONAL: { label: "International", color: "#8b5cf6", icon: "🌍" },
    NATIONAL: { label: "National", color: "#3b82f6", icon: "🏛️" },
    REGIONAL: { label: "Régional", color: "#10b981", icon: "📍" },
    LOCAL: { label: "Local", color: "#f59e0b", icon: "🏠" },
};

export default function SettingsPage() {
    const [association, setAssociation] = useState<Association | null>(null);
    const [form, setForm] = useState({
        name: "",
        slogan: "",
        contact_email: "",
        contact_phone: "",
        address_street: "",
        address_city: "",
        address_zip: "",
        address_country: "",
        legal_form: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Modal state for creating antenne
    const [modalOpen, setModalOpen] = useState(false);
    const [childForm, setChildForm] = useState({
        name: "",
        address_city: "",
        networkLevel: "LOCAL",
        adminEmail: "",
        adminFirstName: "",
        adminLastName: "",
    });
    const [childLoading, setChildLoading] = useState(false);
    const [childError, setChildError] = useState("");
    const [createdChild, setCreatedChild] = useState<{
        name: string;
        email: string;
        tempPassword: string;
    } | null>(null);

    async function loadAssociation() {
        try {
            const data = await apiGet<Association>("/associations/me");
            setAssociation(data);
            setForm({
                name: data.name || "",
                slogan: data.slogan || "",
                contact_email: data.contact_email || "",
                contact_phone: data.contact_phone || "",
                address_street: data.address_street || "",
                address_city: data.address_city || "",
                address_zip: data.address_zip || "",
                address_country: data.address_country || "",
                legal_form: data.legal_form || "",
            });
        } catch {
            setError("Impossible de charger les paramètres.");
        } finally {
            setIsFetching(false);
        }
    }

    useEffect(() => {
        loadAssociation();
    }, []);

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSuccess(false);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setIsLoading(true);

        try {
            const updated = await apiPatch<Association>("/associations/me", form);
            const stored = localStorage.getItem("association");
            if (stored) {
                const parsed = JSON.parse(stored);
                parsed.name = updated.name;
                localStorage.setItem("association", JSON.stringify(parsed));
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Erreur lors de la sauvegarde."
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateChild(e: FormEvent) {
        e.preventDefault();
        setChildError("");
        setChildLoading(true);
        try {
            const result = await apiPost<{
                name: string;
                admin: { email: string; tempPassword: string };
            }>("/associations/children", childForm);
            setCreatedChild({
                name: result.name,
                email: result.admin.email,
                tempPassword: result.admin.tempPassword,
            });
            // Reload to show the new child
            await loadAssociation();
        } catch (err) {
            setChildError(
                err instanceof Error ? err.message : "Erreur lors de la création."
            );
        } finally {
            setChildLoading(false);
        }
    }

    function closeModal() {
        setModalOpen(false);
        setCreatedChild(null);
        setChildError("");
        setChildForm({
            name: "",
            address_city: "",
            networkLevel: "LOCAL",
            adminEmail: "",
            adminFirstName: "",
            adminLastName: "",
        });
    }

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const nlInfo = NETWORK_LEVELS[association?.networkLevel || "LOCAL"] || NETWORK_LEVELS.LOCAL;

    return (
        <RequirePermission permissions={["settings.manage"]}>
            <div className="max-w-4xl space-y-6">
                <h2 className="text-xl font-bold text-white">
                    Paramètres de l&apos;association
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg p-3 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Modifications enregistrées avec succès !
                        </div>
                    )}

                    {/* Card 1: Identité & Contact */}
                    <GlassCard>
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            Identité & Contact
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassInput
                                    label="Nom de l'association"
                                    placeholder="Mon Association"
                                    icon={<Building2 className="w-4 h-4" />}
                                    value={form.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    required
                                />
                                <GlassInput
                                    label="Slogan"
                                    placeholder="Notre devise..."
                                    icon={<MessageSquare className="w-4 h-4" />}
                                    value={form.slogan}
                                    onChange={(e) => updateField("slogan", e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassInput
                                    label="Email de contact"
                                    type="email"
                                    placeholder="contact@asso.com"
                                    icon={<Mail className="w-4 h-4" />}
                                    value={form.contact_email}
                                    onChange={(e) => updateField("contact_email", e.target.value)}
                                />
                                <GlassInput
                                    label="Téléphone"
                                    type="tel"
                                    placeholder="+33 6 12 34 56 78"
                                    icon={<Phone className="w-4 h-4" />}
                                    value={form.contact_phone}
                                    onChange={(e) => updateField("contact_phone", e.target.value)}
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Card 2: Adresse & Légal */}
                    <GlassCard>
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            Adresse & Légal
                        </h3>
                        <div className="space-y-4">
                            <GlassInput
                                label="Rue"
                                placeholder="12 rue de la Paix"
                                icon={<MapPin className="w-4 h-4" />}
                                value={form.address_street}
                                onChange={(e) => updateField("address_street", e.target.value)}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <GlassInput
                                    label="Code postal"
                                    placeholder="75001"
                                    value={form.address_zip}
                                    onChange={(e) => updateField("address_zip", e.target.value)}
                                />
                                <GlassInput
                                    label="Ville"
                                    placeholder="Paris"
                                    value={form.address_city}
                                    onChange={(e) => updateField("address_city", e.target.value)}
                                />
                                <GlassInput
                                    label="Pays"
                                    placeholder="France"
                                    value={form.address_country}
                                    onChange={(e) => updateField("address_country", e.target.value)}
                                />
                            </div>

                            {/* Legal form select */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-300 ml-1">
                                    Forme juridique
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Scale className="w-4 h-4" />
                                    </div>
                                    <select
                                        value={form.legal_form}
                                        onChange={(e) => updateField("legal_form", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all duration-200 hover:bg-white/[0.07] appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-800">
                                            Sélectionner...
                                        </option>
                                        {LEGAL_FORMS.map((lf) => (
                                            <option key={lf} value={lf} className="bg-slate-800">
                                                {lf}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Submit */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-auto">
                            <GlassButton
                                type="submit"
                                isLoading={isLoading}
                                icon={<Save className="w-4 h-4" />}
                                className="sm:w-auto sm:px-8"
                            >
                                Enregistrer les modifications
                            </GlassButton>
                        </div>
                    </div>
                </form>

                {/* ── Card 3: Réseau & Antennes ── */}
                <GlassCard>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            <Network className="w-4 h-4 text-blue-400" />
                            Réseau & Antennes
                        </h3>
                        <GlassButton
                            className="!w-auto px-4 !py-2 text-xs"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setModalOpen(true)}
                        >
                            Créer une antenne
                        </GlassButton>
                    </div>

                    {/* Network Level Badge */}
                    <div className="flex flex-wrap items-center gap-4 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">
                                Niveau :
                            </span>
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border"
                                style={{
                                    backgroundColor: `${nlInfo.color}20`,
                                    borderColor: `${nlInfo.color}40`,
                                    color: nlInfo.color,
                                }}
                            >
                                <span>{nlInfo.icon}</span>
                                {nlInfo.label}
                            </span>
                        </div>

                        {association?.parent && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">
                                    Dépend de :
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white">
                                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                                    {association.parent.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Children Table */}
                    {association && association.children.length > 0 ? (
                        <div className="overflow-x-auto -mx-8 px-8">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left text-gray-400 font-medium py-2.5">
                                            Antenne
                                        </th>
                                        <th className="text-left text-gray-400 font-medium py-2.5">
                                            Ville
                                        </th>
                                        <th className="text-left text-gray-400 font-medium py-2.5">
                                            Niveau
                                        </th>
                                        <th className="text-left text-gray-400 font-medium py-2.5">
                                            Membres
                                        </th>
                                        <th className="text-left text-gray-400 font-medium py-2.5">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {association.children.map((child) => {
                                        const childNl =
                                            NETWORK_LEVELS[child.networkLevel] ||
                                            NETWORK_LEVELS.LOCAL;
                                        return (
                                            <tr
                                                key={child.id}
                                                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                                            >
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                                            {child.name[0]}
                                                        </div>
                                                        <span className="text-white font-medium">
                                                            {child.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-gray-300">
                                                    {child.address_city || "—"}
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                                                        style={{
                                                            backgroundColor: `${childNl.color}15`,
                                                            borderColor: `${childNl.color}30`,
                                                            color: childNl.color,
                                                        }}
                                                    >
                                                        {childNl.icon} {childNl.label}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                                                        <Users className="w-3 h-3" />
                                                        {child._count?.users ?? "—"}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${child.is_active
                                                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                                                            }`}
                                                    >
                                                        {child.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <Network className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">
                                Aucune antenne pour le moment.
                            </p>
                            <p className="text-xs mt-1">
                                Cliquez sur &quot;Créer une antenne&quot; pour
                                développer votre réseau.
                            </p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* ── Create Child Modal ── */}
            <GlassModal
                open={modalOpen}
                onClose={closeModal}
                title="Créer une nouvelle antenne"
            >
                {createdChild ? (
                    /* Success state — show credentials */
                    <div className="space-y-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                            <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                            <p className="text-white font-semibold">
                                Antenne &quot;{createdChild.name}&quot; créée !
                            </p>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                                ⚠️ Identifiants administrateur (à communiquer)
                            </p>
                            <div className="space-y-1">
                                <p className="text-sm text-white">
                                    <span className="text-gray-400">Email :</span>{" "}
                                    <code className="bg-white/10 px-2 py-0.5 rounded text-blue-300">
                                        {createdChild.email}
                                    </code>
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-white">
                                        <span className="text-gray-400">
                                            Mot de passe :
                                        </span>{" "}
                                        <code className="bg-white/10 px-2 py-0.5 rounded text-emerald-300">
                                            {createdChild.tempPassword}
                                        </code>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                createdChild.tempPassword
                                            )
                                        }
                                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <GlassButton onClick={closeModal}>Fermer</GlassButton>
                    </div>
                ) : (
                    /* Creation form */
                    <form onSubmit={handleCreateChild} className="space-y-4">
                        {childError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                                {childError}
                            </div>
                        )}

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                            <p className="text-xs text-blue-300">
                                <strong>💡 Info :</strong> L&apos;antenne sera
                                rattachée à votre association. Un administrateur
                                sera créé avec un mot de passe temporaire.
                            </p>
                        </div>

                        <GlassInput
                            label="Nom de l'antenne"
                            placeholder="Ex: Section Douala"
                            icon={<Building2 className="w-4 h-4" />}
                            value={childForm.name}
                            onChange={(e) =>
                                setChildForm((p) => ({
                                    ...p,
                                    name: e.target.value,
                                }))
                            }
                            required
                        />
                        <GlassInput
                            label="Ville"
                            placeholder="Ex: Douala"
                            icon={<MapPin className="w-4 h-4" />}
                            value={childForm.address_city}
                            onChange={(e) =>
                                setChildForm((p) => ({
                                    ...p,
                                    address_city: e.target.value,
                                }))
                            }
                        />

                        {/* Network level select */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300 ml-1">
                                Niveau hiérarchique
                            </label>
                            <select
                                value={childForm.networkLevel}
                                onChange={(e) =>
                                    setChildForm((p) => ({
                                        ...p,
                                        networkLevel: e.target.value,
                                    }))
                                }
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all duration-200 hover:bg-white/[0.07] appearance-none cursor-pointer"
                            >
                                {Object.entries(NETWORK_LEVELS).map(
                                    ([key, val]) => (
                                        <option
                                            key={key}
                                            value={key}
                                            className="bg-slate-800"
                                        >
                                            {val.icon} {val.label}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-4">
                            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">
                                Administrateur de l&apos;antenne
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <GlassInput
                                    label="Prénom"
                                    placeholder="Jean"
                                    value={childForm.adminFirstName}
                                    onChange={(e) =>
                                        setChildForm((p) => ({
                                            ...p,
                                            adminFirstName: e.target.value,
                                        }))
                                    }
                                    required
                                />
                                <GlassInput
                                    label="Nom"
                                    placeholder="Dupont"
                                    value={childForm.adminLastName}
                                    onChange={(e) =>
                                        setChildForm((p) => ({
                                            ...p,
                                            adminLastName: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="mt-3">
                                <GlassInput
                                    label="Email"
                                    type="email"
                                    placeholder="admin-antenne@example.com"
                                    icon={<Mail className="w-4 h-4" />}
                                    value={childForm.adminEmail}
                                    onChange={(e) =>
                                        setChildForm((p) => ({
                                            ...p,
                                            adminEmail: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <GlassButton
                                type="submit"
                                isLoading={childLoading}
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Créer l&apos;antenne
                            </GlassButton>
                        </div>
                    </form>
                )}
            </GlassModal>
        </RequirePermission>
    );
}
