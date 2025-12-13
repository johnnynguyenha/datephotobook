"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const CARD_CLASS =
    "glass-strong shadow-xl rounded-3xl border border-rose-100/50";

type NotificationType = 
    | "PARTNER_REQUEST" 
    | "PARTNER_ACCEPTED" 
    | "PARTNER_REMOVED"
    | "DATE_REMINDER" 
    | "DATE_UPCOMING"
    | "PHOTO_UPLOAD" 
    | "COMMENT" 
    | "GENERAL";

type NotificationMessage = {
    text?: string;
    from_username?: string;
    from_user_id?: string;
    to_username?: string;
    to_user_id?: string;
    date_title?: string;
    date_id?: string;
    photo_count?: number;
    comment_text?: string;
    [key: string]: unknown;
};

type Notification = {
    id: string;
    type: NotificationType;
    message: NotificationMessage;
    read: boolean;
    createdAt: string;
};

const TYPE_CONFIG: Record<NotificationType, { 
    icon: string; 
    colors: string;
    category: string;
}> = {
    PARTNER_REQUEST: {
        icon: "💕",
        colors: "bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 ring-pink-200",
        category: "partner",
    },
    PARTNER_ACCEPTED: {
        icon: "💑",
        colors: "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600 ring-emerald-200",
        category: "partner",
    },
    PARTNER_REMOVED: {
        icon: "💔",
        colors: "bg-gradient-to-br from-slate-100 to-gray-100 text-slate-600 ring-slate-200",
        category: "partner",
    },
    DATE_REMINDER: {
        icon: "⏰",
        colors: "bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 ring-rose-200",
        category: "reminder",
    },
    DATE_UPCOMING: {
        icon: "📅",
        colors: "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600 ring-amber-200",
        category: "reminder",
    },
    PHOTO_UPLOAD: {
        icon: "📷",
        colors: "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600 ring-sky-200",
        category: "upload",
    },
    COMMENT: {
        icon: "💬",
        colors: "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 ring-violet-200",
        category: "comment",
    },
    GENERAL: {
        icon: "✨",
        colors: "bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 ring-rose-200",
        category: "general",
    },
};

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return "just now";
    } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays === 1) {
        return "yesterday";
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
}

function getNotificationContent(notification: Notification): { title: string; description: string } {
    const { type, message } = notification;

    switch (type) {
        case "PARTNER_REQUEST":
            return {
                title: "Partner request",
                description: message.from_username 
                    ? `${message.from_username} wants to be your partner!`
                    : "Someone sent you a partner request",
            };
        case "PARTNER_ACCEPTED":
            return {
                title: "Partner accepted! 🎉",
                description: message.from_username
                    ? `You and ${message.from_username} are now partners!`
                    : "Your partner request was accepted!",
            };
        case "PARTNER_REMOVED":
            return {
                title: "Partnership ended",
                description: message.from_username
                    ? `${message.from_username} ended the partnership`
                    : "Your partnership has ended",
            };
        case "DATE_REMINDER":
            return {
                title: message.date_title || "Date reminder",
                description: message.text || "Don't forget about your upcoming date!",
            };
        case "DATE_UPCOMING":
            return {
                title: "Upcoming date",
                description: message.date_title 
                    ? `${message.date_title} is coming up soon!`
                    : "You have an upcoming date",
            };
        case "PHOTO_UPLOAD":
            return {
                title: "New photos uploaded",
                description: message.from_username
                    ? `${message.from_username} added ${message.photo_count || "new"} photos`
                    : message.text || "New photos were added to a date",
            };
        case "COMMENT":
            return {
                title: "New comment",
                description: message.from_username
                    ? `${message.from_username} commented on your date`
                    : message.text || "Someone commented on your date",
            };
        case "GENERAL":
        default:
            return {
                title: message.text?.split(".")[0] || "Notification",
                description: message.text || "You have a new notification",
            };
    }
}

type FilterType = "all" | "unread" | "partner" | "dates" | "photos";

export default function NotificationsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [partnerRequests, setPartnerRequests] = useState<Notification[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setUserId(id);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            setError(null);
            const res = await fetch(`/api/notifications?user_id=${userId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch notifications");
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);

            // Separate partner requests for special handling
            const requests = (data.notifications || []).filter(
                (n: Notification) => n.type === "PARTNER_REQUEST" && !n.read
            );
            setPartnerRequests(requests);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError(err instanceof Error ? err.message : "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchNotifications();
        } else {
            setLoading(false);
        }
    }, [userId, fetchNotifications]);

    async function handleMarkAllRead() {
        if (!userId) return;

        setActionLoading("mark-all");
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, mark_all: true }),
            });

            if (!res.ok) {
                throw new Error("Failed to mark notifications as read");
            }

            // Update local state
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all as read:", err);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleMarkRead(notificationId: string) {
        if (!userId) return;

        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, notification_id: notificationId }),
            });

            if (!res.ok) {
                throw new Error("Failed to mark notification as read");
            }

            // Update local state
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }

    async function handleDelete(notificationId: string) {
        if (!userId) return;

        setActionLoading(notificationId);
        try {
            const res = await fetch(
                `/api/notifications?user_id=${userId}&notification_id=${notificationId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                throw new Error("Failed to delete notification");
            }

            // Update local state
            const wasUnread = notifications.find((n) => n.id === notificationId && !n.read);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Error deleting notification:", err);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleAcceptPartnerRequest(notification: Notification) {
        if (!userId) return;

        setActionLoading(notification.id);
        try {
            const res = await fetch("/api/partner/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    notification_id: notification.id,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to accept partner request");
            }

            // Remove from partner requests and update notifications
            setPartnerRequests((prev) => prev.filter((r) => r.id !== notification.id));
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Refresh to get updated data
            fetchNotifications();
        } catch (err) {
            console.error("Error accepting partner request:", err);
            setError(err instanceof Error ? err.message : "Failed to accept partner request");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDeclinePartnerRequest(notification: Notification) {
        if (!userId) return;

        setActionLoading(notification.id);
        try {
            // Just mark as read (effectively declining)
            await handleMarkRead(notification.id);
            setPartnerRequests((prev) => prev.filter((r) => r.id !== notification.id));
        } finally {
            setActionLoading(null);
        }
    }

    // Filter notifications based on selected filter
    const filteredNotifications = notifications.filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return !n.read;
        if (filter === "partner") {
            return ["PARTNER_REQUEST", "PARTNER_ACCEPTED", "PARTNER_REMOVED"].includes(n.type);
        }
        if (filter === "dates") {
            return ["DATE_REMINDER", "DATE_UPCOMING"].includes(n.type);
        }
        if (filter === "photos") {
            return ["PHOTO_UPLOAD", "COMMENT"].includes(n.type);
        }
        return true;
    });

    const filterButtons: { key: FilterType; label: string }[] = [
        { key: "all", label: "All" },
        { key: "unread", label: "Unread" },
        { key: "partner", label: "Partner" },
        { key: "dates", label: "Dates" },
        { key: "photos", label: "Photos" },
    ];

    if (!userId) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 py-10 flex justify-center items-center">
                <div className={`${CARD_CLASS} p-8 text-center max-w-md`}>
                    <div className="text-6xl mb-4">🔔</div>
                    <h2 className="text-2xl font-bold text-rose-700 mb-2">Sign in required</h2>
                    <p className="text-rose-600/70 mb-6">Please sign in to view your notifications.</p>
                    <Link
                        href="/login"
                        className="inline-block rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 font-semibold shadow-lg shadow-rose-200/50 hover:from-rose-600 hover:to-pink-600 hover:scale-105 active:scale-95 transition-all"
                    >
                        Sign in
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 py-10 flex justify-center relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div
                className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.5s" }}
            ></div>

            <div className="w-full max-w-3xl space-y-6 relative z-10">
                {/* Header */}
                <header className={`${CARD_CLASS} p-8`}>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        Notifications
                    </h1>
                    <p className="text-rose-600/70 mt-1">
                        Gentle nudges to help you save memories, stay synced, and never miss a date.
                    </p>
                </header>

                {/* Partner Requests Section (if any) */}
                {partnerRequests.length > 0 && (
                    <section className={`${CARD_CLASS} p-6 animate-slide-in`}>
                        <h2 className="text-lg font-bold text-rose-700 mb-4 flex items-center gap-2">
                            <span className="text-2xl">💕</span>
                            Partner Requests
                        </h2>
                        <div className="space-y-3">
                            {partnerRequests.map((request) => {
                                const content = getNotificationContent(request);
                                return (
                                    <div
                                        key={request.id}
                                        className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200/50 flex flex-col sm:flex-row sm:items-center gap-4"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-rose-800">{content.title}</h3>
                                            <p className="text-sm text-rose-600/80">{content.description}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptPartnerRequest(request)}
                                                disabled={actionLoading === request.id}
                                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 text-sm font-semibold shadow-md hover:from-emerald-600 hover:to-green-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading === request.id ? "..." : "Accept"}
                                            </button>
                                            <button
                                                onClick={() => handleDeclinePartnerRequest(request)}
                                                disabled={actionLoading === request.id}
                                                className="rounded-xl bg-white/80 text-rose-600 px-4 py-2 text-sm font-semibold border border-rose-200 hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Error Message */}
                {error && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-red-600 animate-slide-in">
                        {error}
                    </div>
                )}

                {/* Main Notifications Section */}
                <section className={`${CARD_CLASS} p-8`}>
                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <button
                            onClick={handleMarkAllRead}
                            disabled={actionLoading === "mark-all" || unreadCount === 0}
                            className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-rose-200/50 hover:from-rose-600 hover:to-pink-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading === "mark-all" ? "Marking..." : "Mark all read"}
                        </button>
                        <span className="text-sm text-rose-600/70 font-medium">
                            {unreadCount} unread
                        </span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-rose-200/50">
                        {filterButtons.map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => setFilter(btn.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    filter === btn.key
                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                                        : "bg-white/60 text-rose-600 hover:bg-white/80 border border-rose-200/50"
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Notifications List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-rose-300 border-t-rose-600"></div>
                            <p className="mt-4 text-rose-600/70">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔔</div>
                            <h3 className="text-lg font-bold text-rose-700 mb-2">
                                {filter === "all" ? "No notifications yet" : "No notifications found"}
                            </h3>
                            <p className="text-rose-600/70">
                                {filter === "all"
                                    ? "When something happens, you'll see it here!"
                                    : "Try changing your filter to see more notifications."}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {filteredNotifications.map((notification, index) => {
                                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.GENERAL;
                                const content = getNotificationContent(notification);
                                const isPartnerRequest = notification.type === "PARTNER_REQUEST" && !notification.read;

                                // Skip partner requests in main list (shown above)
                                if (isPartnerRequest) return null;

                                return (
                                    <li
                                        key={notification.id}
                                        className={`p-5 rounded-2xl border-2 flex gap-4 transition-all hover:scale-[1.01] animate-fade-in group ${
                                            notification.read
                                                ? "bg-white/70 border-rose-200/50"
                                                : "bg-white border-rose-300/50 shadow-md"
                                        }`}
                                        style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                                    >
                                        <span
                                            className={`mt-1 inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ring-2 ${config.colors} flex-shrink-0`}
                                        >
                                            {config.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-3 mb-1">
                                                <h3 className="text-base font-bold text-rose-800 truncate">
                                                    {content.title}
                                                </h3>
                                                <span className="text-xs text-rose-500/70 whitespace-nowrap font-medium">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-rose-600/80 mt-1 leading-relaxed">
                                                {content.description}
                                            </p>
                                            {!notification.read && (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-3">
                                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkRead(notification.id)}
                                                    className="text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors"
                                                    title="Mark as read"
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                disabled={actionLoading === notification.id}
                                                className="text-xs text-rose-400 hover:text-red-500 font-medium transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {actionLoading === notification.id ? "..." : "✕"}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Settings Link */}
                <div className="text-center">
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-700 text-sm font-medium transition-colors"
                    >
                        <span>⚙️</span>
                        Notification settings
                    </Link>
                </div>
            </div>
        </main>
    );
}
