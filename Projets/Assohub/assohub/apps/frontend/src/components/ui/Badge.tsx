import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "success" | "warning" | "destructive" | "outline";
    className?: string;
}

export const Badge = ({ children, variant = "primary", className }: BadgeProps) => {
    const variants = {
        primary: "bg-primary/20 text-primary border-primary/30",
        secondary: "bg-secondary/20 text-secondary-foreground border-secondary/30",
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        destructive: "bg-destructive/20 text-destructive border-destructive/30",
        outline: "bg-transparent border-border",
    };

    return (
        <span
            className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
};
