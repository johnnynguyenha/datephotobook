"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Privacy = "PUBLIC" | "PRIVATE";

export default function CreateDatePage() {
    const router = useRouter();

    const [form, setForm] = useState({
        title: "",
        description: "",
        date_time: "",
        location: "",
        privacy: "PUBLIC" as Privacy,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function handleChange(
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        if (!imageFile) {
            alert("Please upload an image.");
            setSubmitting(false);
            return;
        }

        let userId: string | null = null;
        if (typeof window !== "undefined") {
            userId =
                localStorage.getItem("userId") ||
                localStorage.getItem("id") ||
                null;
        }

        console.log("CreateDatePage userId from localStorage:", userId);

        if (!userId) {
            alert("You must be logged in to create a date (userId missing).");
            setSubmitting(false);
            return;
        }

        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("description", form.description);
            fd.append("date_time", form.date_time);
            fd.append("location", form.location);
            fd.append("privacy", form.privacy);
            fd.append("user_id", userId);
            fd.append("image", imageFile);

            const res = await fetch("/api/dates", {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error("Error creating date:", data);
                alert(data.error || "Failed to create date.");
                setSubmitting(false);
                return;
            }

            router.push("/profile");
        } catch (error) {
            console.error(error);
            alert("Failed to create date.");
            setSubmitting(false);
        }
    }

    const inputBase =
        "w-full border-2 border-rose-200/50 bg-white/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-rose-200/50 focus:border-rose-400 placeholder:text-rose-300 text-rose-900 transition-all";

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            
            <div className="w-full max-w-2xl glass-strong shadow-2xl rounded-3xl p-8 relative z-10 animate-slide-in">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                        Create a Date
                    </h1>
                    <Link href="/profile" className="text-rose-500 hover:text-rose-600 font-semibold underline decoration-2 underline-offset-2 transition-colors">
                        Back to Profile
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-5">
                    <label className="grid gap-2">
                        <span className="text-sm font-semibold text-rose-700">Title</span>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Date title"
                            className={inputBase}
                            required
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold text-rose-700">
                            Description
                        </span>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="A fun outing or event"
                            className={`${inputBase} resize-none`}
                            rows={4}
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold text-rose-700">
                            Upload Image
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFile}
                            className="block w-full text-rose-900 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-rose-500 file:to-pink-500 file:text-white file:font-semibold hover:file:from-rose-600 hover:file:to-pink-600 file:transition-all file:cursor-pointer cursor-pointer"
                            required
                        />
                        {imageFile && (
                            <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                                <span>✓</span>
                                <span>Image selected: {imageFile.name}</span>
                            </span>
                        )}
                    </label>

                    <div className="grid sm:grid-cols-2 gap-5">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-rose-700">
                                Date & Time
                            </span>
                            <input
                                type="datetime-local"
                                name="date_time"
                                value={form.date_time}
                                onChange={handleChange}
                                className={inputBase}
                                required
                            />
                        </label>
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-rose-700">
                                Location
                            </span>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="Location"
                                className={inputBase}
                            />
                        </label>
                    </div>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold text-rose-700">Privacy</span>
                        <select
                            name="privacy"
                            value={form.privacy}
                            onChange={handleChange}
                            className={inputBase}
                        >
                            <option value="PUBLIC">🌍 Public</option>
                            <option value="PRIVATE">🔒 Private</option>
                        </select>
                    </label>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-4 font-semibold shadow-lg shadow-rose-200/50 hover:from-rose-600 hover:to-pink-600 hover:shadow-xl hover:shadow-rose-300/50 focus:outline-none focus:ring-4 focus:ring-rose-200/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        {submitting ? "Saving..." : "Save Date"}
                    </button>
                </form>
            </div>
        </main>
    );
}
