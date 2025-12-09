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

    // NEW: which date card has its comments open
    const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);

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

                const mine = (data as DateItem[]).filter((d) => d.user_id === userId);

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

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex flex-col items-center py-10 px-4 relative overflow-hidden">
            {/* Decorative background elements */}
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

                                    {/* Toggle comments for this date */}
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

                                {/* Comments section for this date */}
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
        </main>
    );
}
