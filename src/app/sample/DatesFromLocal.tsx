"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Privacy = "PUBLIC" | "PRIVATE";
type Item = {
  id: number;
  title: string;
  caption?: string;
  image: string;       // can be a URL or Base64 data URL
  date_time?: string;
  location?: string;
  tag?: string;        
  privacy?: Privacy;
};

export default function DatesFromLocal() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("myDates");
      if (!raw) { setItems([]); return; }
      const arr = JSON.parse(raw) as Item[];
      setItems(arr.reverse()); // newest first
    } catch {
      setItems([]);
    }
  }, []);

  if (items === null) return null;

  return (
    <>
      <div className="w-full max-w-5xl flex justify-center mb-6">
        <Link
          href="/create-date"
          className="rounded-lg bg-rose-600 text-white px-5 py-2.5 font-semibold shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          + Add Date
        </Link>
      </div>

      {items.length > 0 && (
        <section className="w-full max-w-5xl mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((d) => (
              <article
                key={d.id}
                className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition"
              >
                <img
                  src={d.image}
                  alt={d.title}
                  className="w-full h-60 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-md font-semibold text-rose-600">{d.title}</h3>
                  {d.caption && (
                    <p className="text-sm text-gray-600 italic">“{d.caption}”</p>
                  )}
                  <dl className="text-xs text-gray-600 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-2">
                    {d.date_time && (
                      <>
                        <dt className="font-medium">When</dt>
                        <dd>{new Date(d.date_time).toLocaleString()}</dd>
                      </>
                    )}
                    {d.location && (
                      <>
                        <dt className="font-medium">Location</dt>
                        <dd>{d.location}</dd>
                      </>
                    )}
                    {d.tag && (
                      <>
                        <dt className="font-medium">Tag</dt>
                        <dd>{d.tag}</dd>
                      </>
                    )}
                    {d.privacy && (
                      <>
                        <dt className="font-medium">Privacy</dt>
                        <dd>{d.privacy}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
