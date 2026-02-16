import React from "react";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
    return (
        <div
            className={`
        backdrop-blur-md bg-white/10 
        border border-white/20 
        shadow-xl shadow-black/10
        rounded-2xl 
        p-8
        ${className}
      `}
        >
            {children}
        </div>
    );
}
