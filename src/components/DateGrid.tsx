"use client";

import { useEffect, useState } from "react";
import CommentsSection from "@/components/comments/CommentsSection";

type Privacy = "PUBLIC" | "PRIVATE" | "INHERIT";

type DateItem = {
    date_id: string;
    title: string | null;
    description: string | null;
    date_time: string;
    location: string | null;
    privacy: Privacy;
    image_path?: string | null;
    user_id?: string;
    owner_partner_id?: string | null;
};

export default function DateGrid() {
    const [dates, setDates] = useState<DateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
    const [viewerId, setViewerId] = useState<string | null>(null);

    // edit state
    const [editingDate, setEditingDate] = useState<DateItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editPrivacy, setEditPrivacy] = useState<Privacy>("PUBLIC");
    const [editDateTime, setEditDateTime] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                let userId: string | null = null;
                if (typeof window !== "undefined") {
                    userId = localStorage.getItem("userId");
                    setViewerId(userId);
                }

                const url = userId
                    ? `/api/dates?user_id=${encodeURIComponent(userId)}`
                    : "/api/dates";

                const res = await fetch(url);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load dates");
                }

                if (isMounted) setDates(data);
            } catch (err: any) {
                console.error(err);
                if (isMounted) setError(err.message || "Failed to load dates");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    function openEditModal(date: DateItem) {
        if (!viewerId) return;
        setEditingDate(date);
        setEditError(null);

        setEditTitle(date.title ?? "");
        setEditDescription(date.description ?? "");
        setEditLocation(date.location ?? "");

        const effectivePrivacy: Privacy =
            date.privacy === "INHERIT" ? "PUBLIC" : date.privacy;
        setEditPrivacy(effectivePrivacy);

        const dt = new Date(date.date_time);
        const iso = dt.toISOString();
        const local = iso.slice(0, 16);
        setEditDateTime(local);
    }

    function closeEditModal() {
        setEditingDate(null);
        setEditError(null);
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingDate || !viewerId) return;

        try {
            setEditLoading(true);
            setEditError(null);

            const res = await fetch("/api/dates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dateId: editingDate.date_id,
                    userId: viewerId,
                    title: editTitle.trim() || null,
                    description: editDescription.trim() || null,
                    location: editLocation.trim() || null,
                    privacy: editPrivacy,
                    date_time: editDateTime || editingDate.date_time,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update date");
            }

            setDates((prev) =>
                prev.map((d) =>
                    d.date_id === editingDate.date_id
                        ? {
                            ...d,
                            title: data.title,
                            description: data.description,
                            location: data.location,
                            privacy: data.privacy,
                            date_time: data.date_time,
                        }
                        : d
                )
            );

            closeEditModal();
        } catch (err: any) {
            console.error(err);
            setEditError(err.message || "Failed to update date");
        } finally {
            setEditLoading(false);
        }
    }

    if (loading) {
        return <p className="text-gray-600 mt-4">Loading dates...</p>;
    }

    if (error) {
        return <p className="text-red-500 mt-4">{error}</p>;
    }

    if (!dates.length) {
        return <p className="text-gray-600 mt-4">No dates yet.</p>;
    }

    return (
        <>
            <section className="w-full max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {dates.map((d, index) => {
                    const raw = d.image_path?.toString().trim();
                    let imageSrc = "/images/heart.jpg";
                    if (raw && raw !== "null" && raw !== "undefined") {
                        imageSrc = raw.startsWith("/") ? raw : `/images/${raw}`;
                    }

                    const commentsOpen = openCommentsId === d.date_id;

                    const canEdit =
                        !!viewerId &&
                        (d.user_id === viewerId || d.owner_partner_id === viewerId);

                    return (
                        <article
                            key={d.date_id}
                            className="glass-strong rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 flex flex-col overflow-hidden hover:scale-[1.02] animate-slide-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="relative w-full h-52 mb-4 overflow-hidden rounded-xl group">
                                <img
                                    src={imageSrc}
                                    alt={d.title || "Date image"}
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (!img.src.endsWith("/images/heart.jpg")) {
                                            img.src = "/images/heart.jpg";
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            <h2 className="font-bold text-rose-700 truncate text-lg mb-2">
                                {d.title || "Untitled date"}
                            </h2>

                            <p className="text-xs text-rose-500/70 mb-2">
                                {new Date(d.date_time).toLocaleString()}
                            </p>

                            {d.location && (
                                <p className="text-sm text-rose-600/80 mb-2 flex items-center gap-1">
                                    <span>📍</span>
                                    <span>{d.location}</span>
                                </p>
                            )}

                            {d.description && (
                                <p className="text-sm text-rose-600/70 line-clamp-3 mb-3 leading-relaxed">
                                    {d.description}
                                </p>
                            )}

                            <div className="mt-auto flex items-center justify-between gap-2">
                <span
                    className={`inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-full font-semibold ${
                        d.privacy === "PRIVATE"
                            ? "bg-rose-100/50 text-rose-600 border border-rose-200/50"
                            : "bg-gradient-to-r from-rose-400/20 to-pink-400/20 text-rose-600 border border-rose-300/50"
                    }`}
                >
                  {d.privacy === "PRIVATE" ? "🔒 Private" : "🌍 Public"}
                </span>

                                <div className="flex items-center gap-2">
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(d)}
                                            className="text-xs font-medium text-rose-600 bg-rose-50/70 border border-rose-200/70 px-3 py-1.5 rounded-full hover:bg-rose-100 transition"
                                        >
                                            Edit
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenCommentsId((prev) =>
                                                prev === d.date_id ? null : d.date_id
                                            )
                                        }
                                        className="text-xs font-medium text-rose-600 bg-rose-50/70 border border-rose-200/70 px-3 py-1.5 rounded-full hover:bg-rose-100 transition"
                                    >
                                        {commentsOpen ? "Hide comments" : "View comments"}
                                    </button>
                                </div>
                            </div>

                            {commentsOpen && (
                                <div className="mt-4">
                                    <CommentsSection dateId={d.date_id} />
                                </div>
                            )}
                        </article>
                    );
                })}
            </section>

            {editingDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="glass-strong rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-rose-900">
                                Edit Date
                            </h2>
                            <button
                                onClick={closeEditModal}
                                className="text-2xl leading-none text-rose-400 hover:text-rose-600"
                            >
                                ×
                            </button>
                        </div>

                        {editError && (
                            <p className="text-sm text-red-500">{editError}</p>
                        )}

                        <form onSubmit={handleSaveEdit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-rose-800 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-black outline-none ring-rose-200 focus:ring"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-rose-800 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-black outline-none ring-rose-200 focus:ring"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-rose-800 mb-1">
                                    Date &amp; Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editDateTime}
                                    onChange={(e) => setEditDateTime(e.target.value)}
                                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-black outline-none ring-rose-200 focus:ring"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-rose-800 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-black outline-none ring-rose-200 focus:ring"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-rose-800 mb-1">
                                    Privacy
                                </label>
                                <select
                                    value={editPrivacy}
                                    onChange={(e) =>
                                        setEditPrivacy(e.target.value as Privacy)
                                    }
                                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-black outline-none ring-rose-200 focus:ring"
                                >
                                    <option value="PUBLIC">Public</option>
                                    <option value="PRIVATE">Private</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 rounded-xl border border-rose-200 text-sm text-rose-700 hover:bg-rose-50"
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-sm font-semibold text-white shadow-md hover:from-rose-600 hover:to-pink-600 disabled:opacity-60"
                                >
                                    {editLoading ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
