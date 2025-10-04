"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Privacy = "PUBLIC" | "PRIVATE";

export default function CreateDatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    caption: "",
    // image will hold a Base64 data URL after upload
    image: "",
    date_time: "",
    location: "",
    tag: "", 
    privacy: "PUBLIC" as Privacy,
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
    reader.onload = () => {
      setForm((f) => ({ ...f, image: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.image) {
      alert("Please upload an image for this date.");
      return;
    }

    const newDate = {
      id: Date.now(),
      title: form.title || "Untitled Date",
      caption: form.caption || "",
      image: form.image, // Base64 data URL
      date_time: form.date_time || undefined,
      location: form.location || undefined,
      tag: form.tag || undefined, // new field
      privacy: form.privacy as Privacy,
      created_at: new Date().toISOString(),
    };

    const raw = localStorage.getItem("myDates");
    const arr = raw ? (JSON.parse(raw) as any[]) : [];
    arr.push(newDate);
    localStorage.setItem("myDates", JSON.stringify(arr));

    router.push("/sample");
  }

  const inputBase =
    "border border-rose-200 bg-white/90 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 placeholder:text-gray-500 text-gray-800";
  const selectBase =
    "border border-rose-200 bg-white/90 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 text-gray-800";

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-rose-600">Create a Date</h1>
          <Link href="/sample" className="text-rose-600 hover:underline">
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
              placeholder="Beach Dinner"
              className={inputBase}
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700">
              Caption / Description
            </span>
            <textarea
              name="caption"
              value={form.caption}
              onChange={handleChange}
              placeholder="Our first sunset together by the ocean"
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
            {form.image && (
              <span className="text-xs text-gray-600">Image selected ✓</span>
            )}
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">
                Date &amp; Time
              </span>
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
                placeholder="Laguna Beach, CA"
                className={inputBase}
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">
                Tag (optional)
              </span>
              <input
                name="tag"
                value={form.tag}
                onChange={handleChange}
                placeholder="beach, cafe, concert…"
                className={inputBase}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Privacy</span>
              <select
                name="privacy"
                value={form.privacy}
                onChange={handleChange}
                className={selectBase}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </label>
          </div>

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
