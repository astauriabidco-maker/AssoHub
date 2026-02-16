"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface RequirePermissionProps {
    permissions: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Route guard component — checks that the current user has at least ONE
 * of the required permissions. Redirects to /dashboard with an error if not.
 */
export default function RequirePermission({ permissions: requiredPermissions, children, fallback }: RequirePermissionProps) {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && !hasPermission(...requiredPermissions)) {
            router.replace("/dashboard?error=unauthorized");
        }
    }, [loading, user, requiredPermissions, hasPermission, router]);

    if (loading) {
        return fallback || null;
    }

    if (!user || !hasPermission(...requiredPermissions)) {
        return null;
    }

    return <>{children}</>;
}
