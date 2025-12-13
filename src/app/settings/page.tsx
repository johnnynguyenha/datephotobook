"use client";

import { useEffect, useState } from "react";
import { getCachedData, setCachedData } from "@/lib/cache";

type ProfileData = {
    user_name: string;
    email?: string;
    partner_name?: string | null;
    display_name?: string | null;
    theme_setting?: string | null;
};

const CARD_CLASS =
    "glass-strong shadow-xl rounded-3xl border border-rose-100/50";

function PasswordSettingsCard() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            let userId: string | null = null;
            if (typeof window !== "undefined") {
                userId = localStorage.getItem("userId");
            }

            if (!userId) {
                throw new Error("You must be logged in to change your password.");
            }

            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to change password");
            }

            setMessage(data.message || "Password updated successfully.");
            setOldPassword("");
            setNewPassword("");
        } catch (err: any) {
            setError(err.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={`${CARD_CLASS} p-8 animate-slide-in`}>
            <h2 className="text-2xl font-bold text-rose-700 mb-2">
                Account security
            </h2>
            <p className="text-sm text-rose-600/70 mb-4">
                Change your password
            </p>

            {error && (
                <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-600">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-700">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-rose-800">
                        Current password
                    </label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full rounded-xl border border-rose-200/70 bg-white/80 px-3 py-2 text-sm text-rose-900 placeholder:text-rose-300 outline-none focus:ring-2 focus:ring-rose-300"
                        placeholder="Current password"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-medium text-rose-800">
                        New password
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-rose-200/70 bg-white/80 px-3 py-2 text-sm text-rose-900 placeholder:text-rose-300 outline-none focus:ring-2 focus:ring-rose-300"
                        placeholder="New password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold px-5 py-2 shadow-lg shadow-rose-200/70 hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? "Saving…" : "Update password"}
                </button>
            </form>
        </section>
    );
}

function NotificationsSettingsCard({ userId }: { userId: string | null }) {
    const [notifications, setNotifications] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        async function fetchSettings() {
            try {
                const res = await fetch(`/api/settings/notifications?user_id=${userId}`);
                const data = await res.json();
                if (res.ok) {
                    setNotifications(data.notifications_enabled ?? true);
                }
            } catch (err) {
                console.error("Failed to fetch notification settings:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, [userId]);

    async function handleToggle() {
        if (!userId || saving) return;

        const newValue = !notifications;
        setNotifications(newValue);
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/settings/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    notifications_enabled: newValue,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Revert on failure
                setNotifications(!newValue);
                setMessage({ type: "error", text: data.error || "Failed to update settings" });
            } else {
                setMessage({ 
                    type: "success", 
                    text: newValue ? "Notifications enabled" : "Notifications disabled" 
                });
                // Clear success message after 2 seconds
                setTimeout(() => setMessage(null), 2000);
            }
        } catch (err) {
            console.error("Failed to update notification settings:", err);
            setNotifications(!newValue);
            setMessage({ type: "error", text: "Failed to update settings" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className={`${CARD_CLASS} p-8 animate-slide-in`}>
            <h2 className="text-2xl font-bold text-rose-700 mb-6">
                notifications
            </h2>

            {message && (
                <div className={`mb-4 rounded-xl px-4 py-2 text-sm ${
                    message.type === "success" 
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                        : "bg-red-50 border border-red-200 text-red-600"
                }`}>
                    {message.text}
                </div>
            )}
            
            <div className="flex items-center justify-between rounded-xl border-2 border-rose-200/50 bg-white/50 px-5 py-4">
                <div>
                    <p className="font-semibold text-rose-800">notifications</p>
                    <p className="text-sm text-rose-600/70">get instant updates</p>
                </div>
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={loading || saving}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${
                        notifications ? "bg-gradient-to-r from-rose-500 to-pink-500" : "bg-rose-200"
                    } ${(loading || saving) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all ${
                            notifications ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                    {saving && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        </span>
                    )}
                </button>
            </div>
        </section>
    );
}

export default function SettingsPage() {
    const [userId, setUserId] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("userId");
        }
        return null;
    });
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setUserId(id);
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        async function load() {
            if (!userId) return;
            try {
                // Check cache first
                const cached = getCachedData<ProfileData>("profile", userId);
                if (cached) {
                    setProfile(cached);
                    setLoading(false);
                    // Still fetch in background to update cache
                    fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && !data.error) {
                                setCachedData("profile", userId, data);
                                setProfile(data);
                            }
                        })
                        .catch(() => {});
                    return;
                }

                setLoading(true);
                const res = await fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`);
                const data = await res.json();
                if (res.ok && data) {
                    setProfile(data);
                    setCachedData("profile", userId, data);
                }
            } catch (err) {
                console.error("failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [userId]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 py-10 flex justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div
                className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.5s" }}
            ></div>

            <div className="w-full max-w-2xl space-y-6 relative z-10">
                <header className={`${CARD_CLASS} p-8`}>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        settings
                    </h1>
                </header>

                <section className={`${CARD_CLASS} p-8 animate-slide-in`}>
                    <h2 className="text-2xl font-bold text-rose-700 mb-2">
                        profile
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/50 border border-rose-200/50">
                            <p className="text-sm font-semibold text-rose-600/70 mb-1">name</p>
                            <p className="text-rose-800 font-medium">{loading ? "..." : (profile?.user_name || "—")}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/50 border border-rose-200/50">
                            <p className="text-sm font-semibold text-rose-600/70 mb-1">partner</p>
                            <p className="text-rose-800 font-medium">{loading ? "..." : (profile?.partner_name || "no partner linked")}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/50 border border-rose-200/50">
                            <p className="text-sm font-semibold text-rose-600/70 mb-1">email</p>
                            <p className="text-rose-800 font-medium">{loading ? "..." : (profile?.email || "—")}</p>
                        </div>
                    </div>
                </section>

                <NotificationsSettingsCard userId={userId} />

                <PasswordSettingsCard />
            </div>
        </main>
    );
}
