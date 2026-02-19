export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api").replace(/\/api$/, "");
export const API_URL = `${BASE_URL}/api`;

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Erreur serveur" }));
        throw new Error(error.message || `Erreur ${res.status}`);
    }

    return res.json();
}

export function apiGet<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint);
}

export function apiPost<T>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {
    return request<T>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function apiPatch<T>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {
    return request<T>(endpoint, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export function apiDelete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" });
}

export async function apiGetBlob(endpoint: string, filename?: string): Promise<void> {
    if (typeof window === "undefined") return;
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error("Erreur lors du téléchargement");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    if (filename) a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
