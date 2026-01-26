"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem("assohub_user");
        if (!user) {
            router.push("/login");
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) return null;

    return (
        <div className="flex min-h-screen bg-slate-950">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen relative z-10 transition-all duration-500">
                {children}
            </main>
        </div>
    );
}
