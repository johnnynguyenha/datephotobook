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

export default function DateGrid() {
    const [dates, setDates] = useState<DateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 🔹 which date’s comments are open in the grid
    const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                let userId: string | null = null;
                if (typeof window !== "undefined") {
                    userId = localStorage.getItem("userId");
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
        <section className="w-full max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                        {/* Privacy badge + comment toggle */}
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

                        {/* Comments for this date */}
                        {commentsOpen && (
                            <div className="mt-4">
                                <CommentsSection dateId={d.date_id} />
                            </div>
                        )}
                    </article>
                );
            })}
        </section>
    );
}
