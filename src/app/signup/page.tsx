"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/nav/BackButton";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState<1 | 2>(1);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [hasPartner, setHasPartner] = useState<null | boolean>(null);
    const [partnerUsername, setPartnerUsername] = useState("");

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [info, setInfo] = useState("");

    const handleNext = async () => {
        setError("");
        setInfo("");

        // check username
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setError("Username is required");
            return;
        }

        // check email
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setError("Email is required");
            return;
        }
        if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
            setError("Please enter a valid email address");
            return;
        }

        // check password
        if (!password) {
            setError("Password is required");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        // make sure passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // see if username or email is already taken
        try {
            const checkRes = await fetch("/api/auth/check-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: trimmedUsername,
                    email: trimmedEmail,
                }),
            });

            const checkData = await checkRes.json();

            if (!checkData.available) {
                setError(checkData.errors?.join(", ") || "Username or email already taken");
                return;
            }

            setStep(2);
        } catch (err) {
            console.error("Error checking availability:", err);
            setError("Failed to verify availability. Please try again.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError("");
        setInfo("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    partnerUsername: hasPartner ? partnerUsername.trim() : null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Signup failed");
                setSubmitting(false);
                return;
            }

            if (data?.token) localStorage.setItem("token", data.token);
            if (data?.user_id) localStorage.setItem("userId", String(data.user_id));
            if (!data?.token && !data?.user_id) {
                localStorage.setItem("user", JSON.stringify(data));
            }

            if (data?.note) setInfo(data.note);

            document.cookie = "auth=1; Path=/; Max-Age=2592000; SameSite=Lax";
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
                        Create Account
                    </h1>
                    <p className="text-rose-600/70 text-sm">
                        {step === 1
                            ? "Start capturing your memories today."
                            : "Tell us about your partner."}
                    </p>
                </div>

                {step === 1 && (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await handleNext();
                        }}
                        className="flex flex-col space-y-5"
                    >
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                            autoComplete="email"
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                            autoComplete="new-password"
                        />

                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                            autoComplete="new-password"
                        />

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            Continue
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                        <div className="text-rose-700 font-medium mb-2">Do you have a partner?</div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setHasPartner(false)}
                                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                                    hasPartner === false
                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400 shadow-lg scale-[1.02]"
                                        : "bg-white/80 text-rose-600 border-rose-200/50 hover:border-rose-300 hover:bg-rose-50/50"
                                }`}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasPartner(true)}
                                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                                    hasPartner === true
                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400 shadow-lg scale-[1.02]"
                                        : "bg-white/80 text-rose-600 border-rose-200/50 hover:border-rose-300 hover:bg-rose-50/50"
                                }`}
                            >
                                Yes
                            </button>
                        </div>

                        {hasPartner && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Partner's Username (optional)"
                                    value={partnerUsername}
                                    onChange={(e) => setPartnerUsername(e.target.value)}
                                    className="w-full p-4 rounded-xl border-2 border-rose-200/50 bg-white/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50 outline-none text-rose-900 placeholder:text-rose-300 transition-all"
                                />
                                <p className="text-xs text-rose-500/70">
                                    If your partner hasn't signed up yet, leave this blank — you can
                                    link them later from your profile.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        {info && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                                <p className="text-rose-600 text-sm">{info}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            {submitting ? "Creating..." : "Sign Up"}
                        </button>

                        <BackButton className="text-rose-500 hover:text-rose-600 underline text-sm text-center w-full transition-colors">
                            Back
                        </BackButton>
                    </form>
                )}

                <p className="text-sm text-center mt-6 text-rose-600/70">
                    Already have an account?{" "}
                    <Link href="/login" className="text-rose-500 hover:text-rose-600 font-semibold underline decoration-2 underline-offset-2 transition-colors">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}
