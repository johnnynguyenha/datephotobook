"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();

    const [step, setStep] = useState<1 | 2>(1);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [hasPartner, setHasPartner] = useState<null | boolean>(null);
    const [partnerUsername, setPartnerUsername] = useState("");

    const [error, setError] = useState("");

    const handleNext = () => {
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    partnerUsername: hasPartner ? partnerUsername : null,
                }),
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
                    {step === 1 ? "Start capturing your memories today." : "Tell us about your partner."}
                </p>

                {step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col space-y-4">
                        <input type="text" placeholder="Username" value={username}
                               onChange={(e) => setUsername(e.target.value)} required
                               className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"/>

                        <input type="email" placeholder="Email" value={email}
                               onChange={(e) => setEmail(e.target.value)} required
                               className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"/>

                        <input type="password" placeholder="Password" value={password}
                               onChange={(e) => setPassword(e.target.value)} required
                               className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"/>

                        <input type="password" placeholder="Confirm Password" value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)} required
                               className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"/>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button type="submit"
                                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition">
                            Continue
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">

                        <div className="text-gray-700">Do you have a partner?</div>
                        <div className="flex gap-3">
                            <button type="button"
                                    onClick={() => setHasPartner(false)}
                                    className={`flex-1 py-2 rounded-lg border ${hasPartner === false ? "bg-rose-500 text-white":"bg-white"}`}>
                                No
                            </button>
                            <button type="button"
                                    onClick={() => setHasPartner(true)}
                                    className={`flex-1 py-2 rounded-lg border ${hasPartner === true ? "bg-rose-500 text-white":"bg-white"}`}>
                                Yes
                            </button>
                        </div>

                        {hasPartner && (
                            <input type="text" placeholder="Partner's Username"
                                   value={partnerUsername}
                                   onChange={(e) => setPartnerUsername(e.target.value)}
                                   required
                                   className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black" />
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button type="submit"
                                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition">
                            Sign Up
                        </button>

                        <button type="button"
                                onClick={() => setStep(1)}
                                className="text-gray-500 underline text-sm">
                            Go Back
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
