"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    permissions?: string[];
}

export interface AuthState {
    user: AuthUser | null;
    loading: boolean;
    permissions: string[];
    hasPermission: (...perms: string[]) => boolean;
    hasRole: (...roles: string[]) => boolean;
    isAdmin: boolean;
    token: string | null;
    logout: () => void;
}

export function useAuth(): AuthState {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const rawUser = localStorage.getItem("user");
            const rawToken = localStorage.getItem("token");
            if (rawUser) setUser(JSON.parse(rawUser));
            if (rawToken) setToken(rawToken);
        } catch {
            // ignored
        } finally {
            setLoading(false);
        }
    }, []);

    const permissions: string[] = user?.permissions || [];

    const hasPermission = useCallback(
        (...perms: string[]) => {
            if (!user) return false;
            // Check if user has at least one of the requested permissions
            return perms.some((p) => permissions.includes(p));
        },
        [user, permissions]
    );

    const hasRole = useCallback(
        (...roles: string[]) => {
            if (!user) return false;
            return roles.includes(user.role);
        },
        [user]
    );

    const isAdmin = hasRole("ADMIN", "SUPER_ADMIN");

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("association");
        router.push("/login");
    }

    return { user, token, loading, permissions, hasPermission, hasRole, isAdmin, logout };
}
