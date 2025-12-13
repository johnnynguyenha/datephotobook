"use client";

import { useEffect, useState, useRef } from "react";
import CommentsSection from "@/components/comments/CommentsSection";
import { getCachedData, setCachedData } from "@/lib/cache";

type Privacy = "PUBLIC" | "PRIVATE" | "INHERIT";

type DateItem = {
    date_id: string;
    title: string | null;
    description: string | null;
    date_time: string;
    location: string | null;
    privacy: Privacy;
    price?: number | null;
    image_path?: string | null;
    user_id?: string;
    owner_partner_id?: string | null;
};

type ProfileData = {
    user_name: string;
    partner_name?: string | null;
    partner_id?: string | null;
    display_name?: string | null;
    theme_setting?: string | null;
};

type DateGridProps = {
    username?: string | null;
    publicView?: boolean;
};

export default function DateGrid({ username, publicView = false }: DateGridProps = {}) {
    const [dates, setDates] = useState<DateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const previousUserIdRef = useRef<string | null>(null);

    // edit state
    const [editingDate, setEditingDate] = useState<DateItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editPrivacy, setEditPrivacy] = useState<Privacy>("PUBLIC");
    const [editDateTime, setEditDateTime] = useState("");
    const [editPrice, setEditPrice] = useState("");

    // delete state
    const [deletingDate, setDeletingDate] = useState<DateItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setViewerId(id);
        }
    }, []);

    useEffect(() => {
        const handleAuthChange = () => {
            if (typeof window !== "undefined") {
                const id = localStorage.getItem("userId");
                setViewerId(id);
            }
        };

        window.addEventListener("authchange", handleAuthChange as EventListener);
        window.addEventListener("storage", handleAuthChange);

        return () => {
            window.removeEventListener("authchange", handleAuthChange as EventListener);
            window.removeEventListener("storage", handleAuthChange);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                if (publicView && username) {
                    // public profile view - only show public dates
                    setLoading(true);
                    setError(null);

                    const res = await fetch(`/api/dates?username=${encodeURIComponent(username)}`);
                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || "Failed to load dates");
                    }

                    if (isMounted) {
                        setDates(Array.isArray(data) ? data : []);
                    }
                    setLoading(false);
                    return;
                }

                const userId = viewerId;
                
                if (!userId) {
                    setLoading(false);
                    return;
                }

                // only clear dates if the user actually changed
                if (previousUserIdRef.current && previousUserIdRef.current !== userId) {
                    // user changed, let react handle removing old dates
                }
                previousUserIdRef.current = userId;

                // get profile to find their partner
                const cachedProfile = getCachedData<ProfileData>("profile", userId);
                let profileData: ProfileData | null = cachedProfile;
                
                if (!cachedProfile) {
                    const profileRes = await fetch(`/api/profile?user_id=${userId}`);
                    if (profileRes.ok) {
                        profileData = await profileRes.json();
                        if (profileData) {
                            setCachedData("profile", userId, profileData);
                        }
                    }
                }

                if (profileData?.partner_id && isMounted) {
                    setPartnerId(profileData.partner_id);
                }

                // check cache first
                const cached = getCachedData<DateItem[]>("dates", userId);
                if (cached && isMounted) {
                    // only show dates from this user or their partner
                    const pid = profileData?.partner_id;
                    const myDates = cached.filter((d) => 
                        d.user_id && 
                        (d.user_id === userId || (pid && d.user_id === pid))
                    );
                    setDates(myDates);
                    setLoading(false);
                    // fetch fresh data in the background
                    fetch(`/api/dates?user_id=${encodeURIComponent(userId)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && !data.error && Array.isArray(data) && isMounted) {
                                setCachedData("dates", userId, data);
                                const pid = profileData?.partner_id;
                                const myDates = data.filter((d: DateItem) => 
                                    d.user_id && 
                                    (d.user_id === userId || (pid && d.user_id === pid))
                                );
                                setDates(myDates);
                            }
                        })
                        .catch(() => {});
                    return;
                }

                setLoading(true);
                setError(null);

                const res = await fetch(`/api/dates?user_id=${encodeURIComponent(userId)}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load dates");
                }

                if (isMounted) {
                    // only show dates from this user or their partner
                    const pid = profileData?.partner_id;
                    const myDates = data.filter((d: DateItem) => 
                        d.user_id && 
                        (d.user_id === userId || (pid && d.user_id === pid))
                    );
                    setDates(myDates);
                    if (userId) {
                        setCachedData("dates", userId, data);
                    }
                }
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
    }, [viewerId, username, publicView]);

    function openEditModal(date: DateItem) {
        if (!viewerId) return;
        setEditingDate(date);
        setEditError(null);

        setEditTitle(date.title ?? "");
        setEditDescription(date.description ?? "");
        setEditLocation(date.location ?? "");
        setEditPrice(date.price?.toString() ?? "");

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
                    price: editPrice.trim() || null,
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
                            price: data.price,
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
        if (!viewerId) return;
        setDeletingDate(date);
    }

    function closeDeleteModal() {
        setDeletingDate(null);
    }

    async function handleConfirmDelete() {
        if (!deletingDate || !viewerId) return;

        try {
            setDeleteLoading(true);

            const res = await fetch(
                `/api/dates?date_id=${encodeURIComponent(deletingDate.date_id)}&user_id=${encodeURIComponent(viewerId)}`,
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
                        !publicView &&
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

                            {d.price !== null && d.price !== undefined && (
                                <p className="text-sm font-semibold text-rose-600 mb-2">
                                    ${Number(d.price).toFixed(2)}
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

                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(d)}
                                            className="text-xs font-medium text-red-600 bg-red-50/70 border border-red-200/70 px-3 py-1.5 rounded-full hover:bg-red-100 transition"
                                        >
                                            Delete
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
                                    Price
                                </label>
                                <input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
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
        </>
    );
}
