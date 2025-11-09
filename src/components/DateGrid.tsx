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

export default function DateGrid() {
    const [dates, setDates] = useState<DateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            {dates.map((d) => {
                const raw = d.image_path?.toString().trim();
                let imageSrc = "/images/heart.jpg";
                if (raw && raw !== "null" && raw !== "undefined") {
                    imageSrc = raw.startsWith("/")
                        ? raw
                        : `/images/${raw}`;
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
                            <p className="text-sm text-gray-700 mb-1">📍 {d.location}</p>
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
    );
}
