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
        image: "",
    });

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result) }));
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.image) {
            alert("Please upload an image.");
            return;
        }

        try {
            await fetch("/api/dates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    profile_id: "your-profile-id",
                }),
            });

            router.push("/profile");
        } catch (error) {
            console.error(error);
            alert("Failed to create date.");
        }
    }

    const inputBase =
        "border border-rose-200 bg-white/90 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 placeholder:text-gray-500 text-gray-800";

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-rose-600">Create a Date</h1>
                    <Link href="/profile" className="text-rose-600 hover:underline">
                        Back to Profile
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <label className="grid gap-1">
                        <span className="text-sm font-medium text-gray-700">Title</span>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Date title"
                            className={inputBase}
                            required
                        />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-sm font-medium text-gray-700">Description</span>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="A fun outing or event"
                            className={inputBase}
                            rows={3}
                        />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-sm font-medium text-gray-700">Upload Image</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFile}
                            className="block w-full text-gray-800 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-rose-600 file:text-white hover:file:bg-rose-700"
                            required
                        />
                        {form.image && <span className="text-xs text-gray-600">Image selected ✓</span>}
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="grid gap-1">
                            <span className="text-sm font-medium text-gray-700">Date & Time</span>
                            <input
                                type="datetime-local"
                                name="date_time"
                                value={form.date_time}
                                onChange={handleChange}
                                className={inputBase}
                            />
                        </label>
                        <label className="grid gap-1">
                            <span className="text-sm font-medium text-gray-700">Location</span>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="Location"
                                className={inputBase}
                            />
                        </label>
                    </div>

                    <label className="grid gap-1">
                        <span className="text-sm font-medium text-gray-700">Privacy</span>
                        <select
                            name="privacy"
                            value={form.privacy}
                            onChange={handleChange}
                            className={inputBase}
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="PRIVATE">Private</option>
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="mt-2 rounded-md bg-rose-600 text-white px-4 py-2 font-semibold shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                        Save Date
                    </button>
                </form>
            </div>
        </main>
    );
}
