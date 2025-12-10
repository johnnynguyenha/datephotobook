"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            }

            setMessage("Password updated! Signing you in…");

            setTimeout(() => {
                if (typeof window !== "undefined") {
                    localStorage.setItem("userId", data.user_id);
                    localStorage.setItem("token", "demo-token");
                    document.cookie = "auth=1; path=/; max-age=604800";
                    window.dispatchEvent(new Event("authchange"));
                }

                window.location.href = "/profile";
            }, 3000);

        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    }



    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4">
            <div className="glass-strong w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-slide-in">
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                    Reset Password
                </h1>

                <p className="text-center text-sm text-rose-500/80">
                    Enter your email and choose a new password.
                </p>

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
                        {message}
                    </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-rose-800">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-rose-900 outline-none focus:ring-2 focus:ring-rose-300 mt-1"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-rose-800">
                            New password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-rose-900 outline-none focus:ring-2 focus:ring-rose-300 mt-1"
                            placeholder="New password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-2.5 shadow-lg hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-60"
                    >
                        {loading ? "Updating…" : "Reset Password"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <a
                        href="/login"
                        className="text-sm text-rose-500 hover:text-rose-700 hover:underline"
                    >
                        ← Back to Sign In
                    </a>
                </div>
            </div>
        </main>
    );
}
