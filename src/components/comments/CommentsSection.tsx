// src/components/comments/CommentsSection.tsx
"use client";

import { useEffect, useState } from "react";

type Comment = {
    comment_id: string;
    content: string;
    created_at: string;
    user_id: string;
    username: string;
};

type Props = {
    dateId: string;
};

export default function CommentsSection({ dateId }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setCurrentUserId(id);
        }
    }, []);

    // Load comments
    useEffect(() => {
        let cancelled = false;

        async function fetchComments() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/comments?dateId=${dateId}`);
                if (!res.ok) {
                    throw new Error("Failed to load comments");
                }
                const data = (await res.json()) as Comment[];
                if (!cancelled) {
                    setComments(data);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message ?? "Failed to load comments");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchComments();
        return () => {
            cancelled = true;
        };
    }, [dateId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;

        if (!currentUserId) {
            setError("You must be logged in to comment.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dateId,
                    content: newComment.trim(),
                    userId: currentUserId,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Failed to post comment");
            }

            const created = (await res.json()) as Comment;
            setComments((prev) => [...prev, created]);
            setNewComment("");
        } catch (err: any) {
            setError(err.message ?? "Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="mt-6 rounded-2xl border border-rose-100 bg-white/70 p-4 shadow-sm backdrop-blur">
            <h3 className="mb-3 text-lg font-semibold text-rose-900">
                Comments
            </h3>

            {loading && (
                <p className="text-sm text-rose-500">Loading comments…</p>
            )}

            {error && (
                <p className="mb-2 text-sm text-red-500">
                    {error}
                </p>
            )}

            {!loading && comments.length === 0 && !error && (
                <p className="mb-3 text-sm text-rose-400">
                    No comments yet. Be the first to say something ✨
                </p>
            )}

            <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {comments.map((c) => (
                    <li
                        key={c.comment_id}
                        className="rounded-xl bg-rose-50 px-3 py-2 text-sm"
                    >
                        <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-rose-800">
                {c.username}
              </span>
                            <span className="text-xs text-rose-400">
                {new Date(c.created_at).toLocaleString()}
              </span>
                        </div>
                        {/* ⬇️ comment text fully black now */}
                        <p className="mt-1 whitespace-pre-wrap text-black">
                            {c.content}
                        </p>
                    </li>
                ))}
            </ul>

            <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <textarea
            className="
            w-full rounded-xl border border-rose-100
            bg-white/60 backdrop-blur
            px-3 py-2 text-sm
            text-black
            placeholder-gray-600
            outline-none ring-rose-300 focus:ring
            "
            placeholder={
                currentUserId
                    ? 'Leave a sweet note about this date…'
                    : 'Log in to add a comment.'
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={!currentUserId || submitting}
        />


                <div className="flex items-center justify-end gap-2">
                    <button
                        type="submit"
                        disabled={
                            submitting || !newComment.trim() || !currentUserId
                        }
                        className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:bg-rose-200"
                    >
                        {submitting ? "Posting…" : "Post comment"}
                    </button>
                </div>
            </form>
        </section>
    );
}
