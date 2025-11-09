"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DateGrid from "@/components/DateGrid";

type ProfileData = {
    user_name: string;
    partner_name?: string | null;
    display_name?: string | null;
    theme_setting?: string | null;
};

type PartnerRequest = {
    notification_id: string;
    from_user_id: string;
    from_username: string;
    to_user_id: string;
    to_username: string;
    created_at: string;
};

type SearchUser = {
    user_id: string;
    username: string;
};

export default function ProfilePage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);
    const [requestsModalOpen, setRequestsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [removeLoading, setRemoveLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setUserId(id);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        async function fetchProfile() {
            try {
                setProfileLoading(true);
                const res = await fetch(`/api/profile?user_id=${userId}`);
                const data = await res.json();
                if (res.ok) setProfile(data);
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setProfileLoading(false);
            }
        }
        fetchProfile();
    }, [userId]);

    async function loadRequests() {
        if (!userId) return;
        try {
            setRequestsLoading(true);
            setRequestsError(null);
            const res = await fetch(`/api/partner/requests?user_id=${userId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load partner requests");
            setRequests(data);
        } catch (err: any) {
            console.error(err);
            setRequestsError(err.message || "Failed to load partner requests");
        } finally {
            setRequestsLoading(false);
        }
    }

    async function handleUserSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        try {
            setSearchLoading(true);
            const res = await fetch(`/api/users/search?query=${encodeURIComponent(searchTerm.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Search failed");
            setSearchResults(
                data.filter((u: SearchUser) => u.user_id !== userId)
            );
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Search failed");
        } finally {
            setSearchLoading(false);
        }
    }

    async function handleSendRequest(to_username: string) {
        if (!userId) return;
        try {
            const res = await fetch("/api/partner/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from_user_id: userId, to_username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send request");
            alert(`Partner request sent to ${to_username}!`);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to send request");
        }
    }

    async function handleAcceptRequest(notification_id: string) {
        if (!userId) return;
        try {
            const res = await fetch("/api/partner/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, notification_id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to accept request");
            alert("Partner accepted!");
            setRequestsModalOpen(false);
            // refresh profile
            const prof = await fetch(`/api/profile?user_id=${userId}`);
            const profData = await prof.json();
            if (prof.ok) setProfile(profData);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to accept request");
        }
    }

    async function handleRemovePartner() {
        if (!userId) return;
        try {
            setRemoveLoading(true);
            const res = await fetch("/api/partner/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to remove partner");
            alert("Partner removed!");
            setProfile((p) => (p ? { ...p, partner_name: null } : p));
            setRemoveModalOpen(false);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to remove partner");
        } finally {
            setRemoveLoading(false);
        }
    }

    const firstName = profile?.user_name?.split(" ")[0] ?? "Profile";
    const partnerFirstName =
        profile?.partner_name && profile.partner_name.trim() !== ""
            ? profile.partner_name.split(" ")[0]
            : null;

    const displayTitle = partnerFirstName
        ? `${firstName} and ${partnerFirstName} 💞`
        : firstName;

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 flex flex-col items-center py-10 px-4">
            {/* Profile Card */}
            <div className="bg-white/80 backdrop-blur-md shadow-lg p-6 w-full max-w-2xl text-center mb-6 rounded-2xl relative">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-rose-300 shadow-md">
                        <img
                            src="/images/heart.jpg"
                            alt="Profile"
                            className="object-cover w-full h-full"
                            onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.src.endsWith("/images/heart.jpg")) {
                                    img.src = "/images/heart.jpg";
                                }
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {profileLoading ? (
                            <h1 className="text-2xl font-bold text-rose-600">Loading...</h1>
                        ) : (
                            <h1 className="text-2xl font-bold text-rose-600">
                                {displayTitle}
                            </h1>
                        )}

                        <button
                            onClick={() => {
                                setRequestsModalOpen(true);
                                loadRequests();
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-300 text-lg font-bold"
                        >
                            +
                        </button>

                        {partnerFirstName && (
                            <button
                                onClick={() => setRemoveModalOpen(true)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-300 text-lg font-bold"
                            >
                                –
                            </button>
                        )}
                    </div>

                    <p className="text-gray-600 mt-1">
                        {profile?.display_name
                            ? `"${profile.display_name}"`
                            : `"Making memories one date at a time 💕"`}
                    </p>

                    <div className="mt-4">
                        <Link
                            href="/create-date"
                            className="rounded-lg bg-rose-600 text-white px-5 py-2.5 font-semibold shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                        >
                            + Add Date
                        </Link>
                    </div>
                </div>
            </div>

            <DateGrid />

            {requestsModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-rose-700">
                                Partner Requests
                            </h2>
                            <button
                                onClick={() => setRequestsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUserSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search user to send request..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-rose-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-800"
                            />
                            <button
                                type="submit"
                                disabled={searchLoading}
                                className="bg-rose-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-rose-700"
                            >
                                {searchLoading ? "..." : "Find"}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <ul className="max-h-40 overflow-y-auto space-y-2">
                                {searchResults.map((u) => (
                                    <li
                                        key={u.user_id}
                                        className="flex items-center justify-between border border-rose-100 rounded-md px-3 py-2"
                                    >
                                        <span className="text-sm text-gray-800">{u.username}</span>
                                        <button
                                            onClick={() => handleSendRequest(u.username)}
                                            className="text-xs font-semibold bg-rose-600 text-white px-3 py-1 rounded-md hover:bg-rose-700"
                                        >
                                            Send
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <hr className="my-3" />

                        {requestsLoading ? (
                            <p className="text-gray-600 text-sm">Loading requests...</p>
                        ) : requestsError ? (
                            <p className="text-red-500 text-sm">{requestsError}</p>
                        ) : requests.length === 0 ? (
                            <p className="text-gray-600 text-sm">No incoming requests.</p>
                        ) : (
                            <ul className="max-h-40 overflow-y-auto space-y-2">
                                {requests.map((r) => (
                                    <li
                                        key={r.notification_id}
                                        className="flex items-center justify-between border border-rose-100 rounded-md px-3 py-2"
                                    >
                    <span className="text-sm text-gray-800">
                      {r.from_username}
                    </span>
                                        <button
                                            onClick={() => handleAcceptRequest(r.notification_id)}
                                            className="text-xs font-semibold bg-rose-600 text-white px-3 py-1 rounded-md hover:bg-rose-700"
                                        >
                                            Accept
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {removeModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
                        <h2 className="text-lg font-semibold text-rose-700">
                            Remove Partner
                        </h2>
                        <p className="text-sm text-gray-700">
                            Are you sure you want to remove your current partner?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRemoveModalOpen(false)}
                                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                                disabled={removeLoading}
                            >
                                No
                            </button>
                            <button
                                onClick={handleRemovePartner}
                                className="px-4 py-2 rounded-md bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                                disabled={removeLoading}
                            >
                                {removeLoading ? "Removing..." : "Yes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

