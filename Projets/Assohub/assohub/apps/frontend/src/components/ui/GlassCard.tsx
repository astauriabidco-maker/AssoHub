"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I will adjust

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => {
    return (
        <div
            className={cn(
                "backdrop-blur-md bg-white/10 border border-white/20 shadow-xl rounded-2xl overflow-hidden",
                className
            )}
        >
            {children}
        </div>
    );
};
