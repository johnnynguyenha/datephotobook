// src/app/dates/page.tsx
"use client";

import { useEffect, useState } from "react";

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

                // This returns your dates + public others;
                // we'll filter to only this user's dates on the client
                const res = await fetch(`/api/dates?user_id=${encodeURIComponent(userId)}`);
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

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 flex flex-col items-center py-10 px-4">
            <div className="bg-white/80 backdrop-blur-md shadow-lg p-6 w-full max-w-4xl mb-6 rounded-2xl">
                <h1 className="text-2xl font-bold text-rose-600">My Dates</h1>
                <p className="text-gray-600 text-sm mt-1">
                    All the dates you&apos;ve saved.
                </p>
            </div>

            {loading ? (
                <p className="text-gray-600 mt-4">Loading dates...</p>
            ) : error ? (
                <p className="text-red-500 mt-4">{error}</p>
            ) : dates.length === 0 ? (
                <p className="text-gray-600 mt-4">You don&apos;t have any dates yet.</p>
            ) : (
                <section className="w-full max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {dates.map((d) => {
                        const raw = d.image_path?.toString().trim();
                        let imageSrc = "/images/heart.jpg";
                        if (raw && raw !== "null" && raw !== "undefined") {
                            imageSrc = raw.startsWith("/") ? raw : `/images/${raw}`;
                        }

                        return (
                            <article
                                key={d.date_id}
                                className="bg-white/80 rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col overflow-hidden"
                            >
                                <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg">
                                    <img
                                        src={imageSrc}
                                        alt={d.title || "Date image"}
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            if (!img.src.endsWith("/images/heart.jpg")) {
                                                img.src = "/images/heart.jpg";
                                            }
                                        }}
                                    />
                                </div>

                                <h2 className="font-semibold text-rose-700 truncate">
                                    {d.title || "Untitled date"}
                                </h2>

                                <p className="text-xs text-gray-500 mb-1">
                                    {new Date(d.date_time).toLocaleString()}
                                </p>

                                {d.location && (
                                    <p className="text-sm text-gray-700 mb-1">
                                        📍 {d.location}
                                    </p>
                                )}

                                {d.description && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                                        {d.description}
                                    </p>
                                )}

                                <span
                                    className={`mt-auto inline-flex items-center text-xs px-2 py-1 rounded-full ${
                                        d.privacy === "PRIVATE"
                                            ? "bg-gray-100 text-gray-600"
                                            : "bg-rose-50 text-rose-500"
                                    }`}
                                >
                  {d.privacy === "PRIVATE" ? "Private" : "Public"}
                </span>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}
