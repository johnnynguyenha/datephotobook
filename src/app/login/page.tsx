"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                setSubmitting(false);
                return;
            }

            localStorage.setItem("token", "logged-in");
            localStorage.setItem("userId", data.user_id);
            localStorage.setItem(
                "user",
                JSON.stringify({ user_id: data.user_id, username: data.username })
            );

            document.cookie =
                "auth=1; Path=/; Max-Age=2592000; SameSite=Lax";
            window.dispatchEvent(new Event("authchange"));

            const next = searchParams?.get("next") || "/profile";
            router.replace(next);
        } catch (err) {
            console.error(err);
            setError("Server error. Try again later.");
            setSubmitting(false);
        }
    };


    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            
            <div className="glass-strong p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-slide-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent mb-3">
                        💕 Date Photobook
                    </h1>
                    <p className="text-rose-600/70 text-sm">
                        Relive life's best moments. Save them.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        {submitting ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <div className="text-center text-sm text-rose-600/70 mt-6">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-rose-500 hover:text-rose-600 font-semibold underline decoration-2 underline-offset-2 transition-colors">
                        Sign up
                    </Link>
                </div>
            </div>
        </main>
    );
}
