"use client";

import { useState } from "react";

type ToggleKey = "email" | "sms" | "push" | "digest";

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
        <section className={`${CARD_CLASS} p-8 animate-slide-in`} style={{ animationDelay: "400ms" }}>
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

export default function SettingsPage() {
    const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
        email: true,
        sms: false,
        push: true,
        digest: false,
    });

    const toggle = (key: ToggleKey) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 py-10 flex justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div
                className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.5s" }}
            ></div>

            <div className="w-full max-w-4xl space-y-6 relative z-10">
                <header className={`${CARD_CLASS} p-8 animate-slide-in`}>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        Settings
                    </h1>
                    <p className="text-rose-600/70 mt-1">
                        Adjust how Date Photo Book keeps you informed and personalise your
                        space.
                    </p>
                </header>

                <section
                    className={`${CARD_CLASS} p-8 animate-slide-in`}
                    style={{ animationDelay: "100ms" }}
                >
                    <h2 className="text-2xl font-bold text-rose-700 mb-2">
                        Profile Snapshot
                    </h2>
                    <p className="text-sm text-rose-600/70 mb-6">
                        These basics come from your signup details. Editing is coming soon.
                    </p>
                    <dl className="grid gap-5 sm:grid-cols-2 text-sm">
                        {[
                            { label: "Name", value: "You + Your Person" },
                            { label: "Email", value: "couple@example.com" },
                            { label: "Partner Link", value: "Pending confirmation" },
                            { label: "Plan", value: "Free memories" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="p-4 rounded-xl bg-white/50 border border-rose-200/50"
                            >
                                <dt className="font-semibold text-rose-600/70 mb-1">
                                    {item.label}
                                </dt>
                                <dd className="text-rose-800 font-medium">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section
                    className={`${CARD_CLASS} p-8 animate-slide-in`}
                    style={{ animationDelay: "200ms" }}
                >
                    <h2 className="text-2xl font-bold text-rose-700 mb-2">
                        Notification Preferences
                    </h2>
                    <p className="text-sm text-rose-600/70 mb-6">
                        Pick how we nudge you about upcoming dates, uploads, or partner
                        activity.
                    </p>
                    <ul className="space-y-3">
                        {(() => {
                            const NOTIFICATION_OPTIONS: {
                                key: ToggleKey;
                                label: string;
                                detail: string;
                            }[] = [
                                {
                                    key: "email",
                                    label: "Email reminders",
                                    detail: "Weekly wrap-ups and important alerts.",
                                },
                                {
                                    key: "sms",
                                    label: "Text messages",
                                    detail: "Last-minute date reminders straight to your phone.",
                                },
                                {
                                    key: "push",
                                    label: "Push notifications",
                                    detail: "Instant updates in the browser or app.",
                                },
                                {
                                    key: "digest",
                                    label: "Monthly digest",
                                    detail: "A highlight reel every month.",
                                },
                            ];
                            return NOTIFICATION_OPTIONS.map(
                                ({ key, label, detail }) => (
                                    <li
                                        key={key}
                                        className="flex items-center justify-between rounded-xl border-2 border-rose-200/50 bg-white/50 px-5 py-4 hover:bg-white/70 transition-all"
                                    >
                                        <div>
                                            <p className="font-semibold text-rose-800">{label}</p>
                                            <p className="text-sm text-rose-600/70">{detail}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggle(key)}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${
                                                toggles[key]
                                                    ? "bg-gradient-to-r from-rose-500 to-pink-500"
                                                    : "bg-rose-200"
                                            }`}
                                            aria-pressed={toggles[key]}
                                        >
                      <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all ${
                              toggles[key] ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                                        </button>
                                    </li>
                                )
                            );
                        })()}
                    </ul>
                </section>

                <section
                    className={`${CARD_CLASS} p-8 animate-slide-in`}
                    style={{ animationDelay: "300ms" }}
                >
                    <h2 className="text-2xl font-bold text-rose-700 mb-2">
                        Memory Retention
                    </h2>
                    <p className="text-sm text-rose-600/70 mb-6">
                        Decide how long we keep archived photos and drafts before we prompt
                        you.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { label: "Photo backup", value: "Forever" },
                            { label: "Draft dates", value: "30 days" },
                            { label: "Shared albums", value: "Until both remove" },
                            { label: "Download format", value: "High quality JPG" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border-2 border-rose-200/50 bg-white/50 p-5 hover:bg-white/70 transition-all"
                            >
                                <p className="text-xs uppercase tracking-wide text-rose-600/70 font-semibold mb-2">
                                    {item.label}
                                </p>
                                <p className="text-lg font-bold text-rose-800">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <PasswordSettingsCard />
            </div>
        </main>
    );
}
