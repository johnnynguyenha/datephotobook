"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Signup failed");
                return;
            }

            localStorage.setItem("user", JSON.stringify(data));


            router.push("/profile");
        } catch (err) {
            console.error(err);
            setError("Server error. Try again later.");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-4 text-rose-600">
                    Create Account
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Start capturing your memories today.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
                        required
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
                        required
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{" "}
                    <a href="/login" className="text-rose-500 hover:underline font-medium">
                        Log in
                    </a>
                </div>
            </div>
        </main>
    );
}
