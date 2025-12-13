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
};

export default function DatesPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [dates, setDates] = useState<DateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);

    const [editingDate, setEditingDate] = useState<DateItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editPrivacy, setEditPrivacy] = useState<Privacy>("PUBLIC");
    const [editDateTime, setEditDateTime] = useState("");

    const [deletingDate, setDeletingDate] = useState<DateItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setUserId(id);
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(
                    `/api/dates?user_id=${encodeURIComponent(userId)}`
                );
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load dates");
                }

                const mine = (data as DateItem[]).filter(
                    (d) => d.user_id === userId
                );

                if (isMounted) setDates(mine);
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
    }, [userId]);

    function openEditModal(date: DateItem) {
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
        if (!editingDate || !userId) return;

        try {
            setEditLoading(true);
            setEditError(null);

            const res = await fetch("/api/dates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dateId: editingDate.date_id,
                    userId,
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

    function openDeleteModal(date: DateItem) {
        setDeletingDate(date);
    }

    function closeDeleteModal() {
        setDeletingDate(null);
    }

    async function handleConfirmDelete() {
        if (!deletingDate || !userId) return;

        try {
            setDeleteLoading(true);

            const res = await fetch(
                `/api/dates?date_id=${encodeURIComponent(deletingDate.date_id)}&user_id=${encodeURIComponent(userId)}`,
                { method: "DELETE" }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete date");
            }

            setDates((prev) =>
                prev.filter((d) => d.date_id !== deletingDate.date_id)
            );

            closeDeleteModal();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to delete date");
        } finally {
            setDeleteLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex flex-col items-center py-10 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div
                className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.5s" }}
            ></div>

            <div className="glass-strong shadow-2xl p-8 w-full max-w-4xl mb-8 rounded-3xl relative z-10 animate-slide-in">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    My Dates
                </h1>
                <p className="text-rose-600/70 text-sm">
                    All the dates you&apos;ve saved.
                </p>
            </div>

            {loading ? (
                <div className="relative z-10">
                    <p className="text-rose-600/70 mt-4 text-center">Loading dates...</p>
                </div>
            ) : error ? (
                <div className="relative z-10 p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-600">{error}</p>
                </div>
            ) : dates.length === 0 ? (
                <div className="relative z-10 glass-strong p-8 rounded-3xl text-center">
                    <p className="text-rose-600/70 text-lg">
                        You don&apos;t have any dates yet.
                    </p>
                    <p className="text-rose-500/60 text-sm mt-2">
                        Create your first date to get started! 💕
                    </p>
                </div>
            ) : (
                <section className="w-full max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
                    {dates.map((d, index) => {
                        const raw = d.image_path?.toString().trim();
                        let imageSrc = "/images/heart.jpg";
                        if (raw && raw !== "null" && raw !== "undefined") {
                            imageSrc = raw.startsWith("/") ? raw : `/images/${raw}`;
                        }

                        const commentsOpen = openCommentsId === d.date_id;

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
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(d)}
                                            className="text-xs font-medium text-rose-600 bg-rose-50/70 border border-rose-200/70 px-3 py-1.5 rounded-full hover:bg-rose-100 transition"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(d)}
                                            className="text-xs font-medium text-red-600 bg-red-50/70 border border-red-200/70 px-3 py-1.5 rounded-full hover:bg-red-100 transition"
                                        >
                                            Delete
                                        </button>

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
            )}

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

            {deletingDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="glass-strong rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-slide-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-rose-900">
                                Delete Date
                            </h2>
                            <button
                                onClick={closeDeleteModal}
                                className="text-2xl leading-none text-rose-400 hover:text-rose-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="text-center py-4">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <p className="text-rose-800 font-medium mb-2">
                                Are you sure you want to delete this date?
                            </p>
                            <p className="text-rose-600/70 text-sm">
                                &quot;{deletingDate.title || "Untitled date"}&quot;
                            </p>
                            <p className="text-red-500/80 text-xs mt-3">
                                This action cannot be undone. All photos and comments associated with this date will also be deleted.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="px-4 py-2 rounded-xl border border-rose-200 text-sm text-rose-700 hover:bg-rose-50"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-sm font-semibold text-white shadow-md hover:from-red-600 hover:to-red-700 disabled:opacity-60"
                            >
                                {deleteLoading ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}