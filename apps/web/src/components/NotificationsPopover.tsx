"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Info, AlertTriangle, FileText, CheckCircle, Crosshair } from "lucide-react";
import { Notification } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationsPopover() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.read).length);
            }
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    const markAsRead = async (id: string, link?: string) => {
        if (!token) return;
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) { console.error(err); }

        if (link) {
            window.location.href = link;
        }
    };

    const markAllRead = async () => {
        if (!token) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'ASSIGNMENT': return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'OBJECTIVE': return <Crosshair className="w-4 h-4 text-blue-400" />;
            case 'DOCUMENT': return <FileText className="w-4 h-4 text-amber-400" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
            case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-400" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0f172a]" />
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Tout marquer comme lu
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    Aucune notification
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markAsRead(n.id, n.link)}
                                        className={`p-3 rounded-lg flex gap-3 cursor-pointer transition-colors ${n.read ? 'opacity-60 hover:bg-white/5' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${n.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-600 mt-1.5">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
