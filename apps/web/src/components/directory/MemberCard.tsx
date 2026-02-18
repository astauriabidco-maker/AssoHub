"use client";

import { Briefcase, Building2, GraduationCap, MapPin } from "lucide-react";
import {
    DirectoryMember,
    PRO_STATUS_LABELS,
    SECTOR_LABELS,
    EDUCATION_LABELS,
    SKILL_CATEGORY_COLORS,
    memberName,
    memberInitials,
} from "./constants";

interface MemberCardProps {
    member: DirectoryMember;
    onEdit: () => void;
    isMentor?: boolean;
}

export default function MemberCard({ member: m, onEdit, isMentor }: MemberCardProps) {
    return (
        <button
            onClick={onEdit}
            className="group relative bg-white/5 border border-white/10 rounded-xl p-5 text-left hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 cursor-pointer"
        >
            {isMentor && (
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-amber-400 to-orange-500" />
            )}

            <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {memberInitials(m)}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {memberName(m)}
                    </h3>
                    {m.jobTitle && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            {m.jobTitle}
                        </p>
                    )}
                    {m.employer && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {m.employer}
                        </p>
                    )}
                </div>
                {m.availableForMentoring && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        🤝 Mentor
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                {m.professionalStatus && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-gray-400">
                        {PRO_STATUS_LABELS[m.professionalStatus] || m.professionalStatus}
                    </span>
                )}
                {m.industrySector && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-gray-400">
                        {SECTOR_LABELS[m.industrySector] || m.industrySector}
                    </span>
                )}
                {m.educationLevel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-gray-400">
                        <GraduationCap className="w-2.5 h-2.5" />
                        {EDUCATION_LABELS[m.educationLevel] || m.educationLevel}
                    </span>
                )}
            </div>

            {m.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {m.skills.slice(0, 4).map((s) => (
                        <span key={s.id} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${SKILL_CATEGORY_COLORS[s.category || "OTHER"]}`}>
                            {s.name}
                        </span>
                    ))}
                    {m.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] text-gray-500">+{m.skills.length - 4}</span>
                    )}
                </div>
            )}

            {m.residence_city && (
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {m.residence_city}{m.residence_country ? `, ${m.residence_country}` : ""}
                </p>
            )}
        </button>
    );
}
