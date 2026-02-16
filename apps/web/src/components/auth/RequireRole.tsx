"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface RequireRoleProps {
    roles: string[];
    children: React.ReactNode;
}

export default function RequireRole({ roles, children }: RequireRoleProps) {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && !hasRole(...roles)) {
            router.replace("/dashboard?error=unauthorized");
        }
    }, [loading, user, roles, hasRole, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !hasRole(...roles)) {
        return null;
    }

    return <>{children}</>;
}
