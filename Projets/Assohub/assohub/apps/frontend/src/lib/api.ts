export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // Get token from localStorage if available
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("assohub_token");
        if (token) {
            (headers as any)["Authorization"] = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}
