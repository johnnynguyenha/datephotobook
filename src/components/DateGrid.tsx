"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Privacy = "PUBLIC" | "PRIVATE";

export type DateItem = {
    date_id: string;
    title: string;
    description?: string;
    image: string;
    date_time?: string;
    location?: string;
    privacy?: Privacy;
};

export default function DateGrid() {
    const [items, setItems] = useState<DateItem[]>([]);

    useEffect(() => {
        fetch("/api/dates")
            .then(res => res.json())
            .then(setItems)
            .catch(() => setItems([]));
    }, []);

    if (items.length === 0)
        return <p className="text-center text-gray-500 mt-6">No dates yet.</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
            {items.map((d) => (
                    <Link
                        key={d.date_id}
                href={`/dates/${d.date_id}`}
    className="group bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-2 p-4 flex flex-col items-center"
    >
    <div className="bg-white p-2 rounded-lg shadow-inner w-full">
    <img
        src={d.image}
    alt={d.title}
    className="w-full h-60 object-cover rounded-md"
        />
        </div>
        <div className="mt-3 text-center">
    <h2 className="text-md font-semibold text-rose-600">{d.title}</h2>
    {d.description && (
        <p className="text-sm text-gray-600 italic">"{d.description}"</p>
    )}
    <dl className="text-xs text-gray-600 mt-1">
        {d.date_time && (
                <div>
                    <dt>When:</dt>
    <dd>{new Date(d.date_time).toLocaleString()}</dd>
    </div>
)}
    {d.location && (
        <div>
            <dt>Location:</dt>
    <dd>{d.location}</dd>
    </div>
    )}
    {d.privacy && (
        <div>
            <dt>Privacy:</dt>
    <dd>{d.privacy}</dd>
    </div>
    )}
    </dl>
    </div>
    </Link>
))}
    </div>
);
}
