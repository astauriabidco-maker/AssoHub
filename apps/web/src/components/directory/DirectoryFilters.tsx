"use client";

import { Filter } from "lucide-react";
import { PRO_STATUS_LABELS, SECTOR_LABELS, EDUCATION_LABELS } from "./constants";

interface DirectoryFiltersProps {
    show: boolean;
    onToggle: () => void;
    filterSector: string;
    setFilterSector: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    filterEducation: string;
    setFilterEducation: (v: string) => void;
    filterMentoring: string;
    setFilterMentoring: (v: string) => void;
    filterCity: string;
    setFilterCity: (v: string) => void;
    filterSkill: string;
    setFilterSkill: (v: string) => void;
    activeFilterCount: number;
    onReset: () => void;
}

export default function DirectoryFilters({
    show,
    onToggle,
    filterSector, setFilterSector,
    filterStatus, setFilterStatus,
    filterEducation, setFilterEducation,
    filterMentoring, setFilterMentoring,
    filterCity, setFilterCity,
    filterSkill, setFilterSkill,
    activeFilterCount,
    onReset,
}: DirectoryFiltersProps) {
    return (
        <>
            {/* Toggle button */}
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${show || activeFilterCount > 0
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
                    }`}
            >
                <Filter className="w-4 h-4" />
                Filtres
                {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            {show && (
                <div className="col-span-full grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-xl p-4 animate-in slide-in-from-top-2">
                    <SelectField label="Secteur" value={filterSector} onChange={setFilterSector} options={SECTOR_LABELS} allLabel="Tous" />
                    <SelectField label="Situation" value={filterStatus} onChange={setFilterStatus} options={PRO_STATUS_LABELS} allLabel="Toutes" />
                    <SelectField label="Niveau d'études" value={filterEducation} onChange={setFilterEducation} options={EDUCATION_LABELS} allLabel="Tous" />
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ville</label>
                        <input type="text" placeholder="Ex: Paris, Douala…" value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Compétence</label>
                        <input type="text" placeholder="Ex: comptabilité, marketing…" value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
                    </div>
                    <SelectField label="Mentorat" value={filterMentoring} onChange={setFilterMentoring}
                        options={{ true: "🤝 Disponible", false: "Non disponible" }} allLabel="Tous" />
                    {activeFilterCount > 0 && (
                        <div className="flex items-end sm:col-span-2 lg:col-span-3">
                            <button onClick={onReset}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer underline">
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

function SelectField({ label, value, onChange, options, allLabel }: {
    label: string; value: string; onChange: (v: string) => void;
    options: Record<string, string>; allLabel: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60">
                <option value="" className="bg-slate-800">{allLabel}</option>
                {Object.entries(options).map(([k, v]) => (
                    <option key={k} value={k} className="bg-slate-800">{v}</option>
                ))}
            </select>
        </div>
    );
}
