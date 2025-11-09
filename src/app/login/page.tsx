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
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-4 text-rose-600">
                    Date Photobook
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Relive life's best moments. Save them.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
                        required
                        autoComplete="email"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
                        required
                        autoComplete="current-password"
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                    >
                        {submitting ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-600 mt-4">
                    Don’t have an account?{" "}
                    <Link href="/signup" className="text-rose-500 hover:underline font-medium">
                        Sign up
                    </Link>
                </div>
            </div>
        </main>
    );
}
