"use client";

import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            if (typeof window !== "undefined") {
                localStorage.setItem("userId", data.user_id);

                localStorage.setItem("token", "demo-token");

                document.cookie = "auth=1; path=/; max-age=604800";

                window.dispatchEvent(new Event("authchange"));
            }

            window.location.href = "/profile";
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl animate-float" />
            <div
                className="absolute bottom-0 right-0 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.2s" }}
            />

            <div className="glass-strong w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 relative z-10">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent text-center">
                    Date Photo Book
                </h1>
                <p className="text-center text-sm text-rose-500/80">
                    Log in to keep making memories together 💕
                </p>

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-rose-800">
                            Email
                        </label>
                        <input
                            data-testid="login-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-rose-200/70 bg-white/80 px-3 py-2 text-sm text-rose-900 placeholder:text-rose-300 outline-none focus:ring-2 focus:ring-rose-300"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-rose-800">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-rose-200/70 bg-white/80 px-3 py-2 text-sm text-rose-900 placeholder:text-rose-300 outline-none focus:ring-2 focus:ring-rose-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-2.5 shadow-lg shadow-rose-200/60 hover:from-rose-600 hover:to-pink-600 hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in…" : "Log in"}
                    </button>
                </form>

                <div className="text-right mt-2">
                    <a
                        href="/forgot-password"
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline transition"
                    >
                        Forgot password?
                    </a>
                </div>
            </div>
        </main>
    );
}
