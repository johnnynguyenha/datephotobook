"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import DateGrid from "@/components/DateGrid";
import { getCachedData, setCachedData } from "@/lib/cache";

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

    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [avatarVersion, setAvatarVersion] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [profileLink, setProfileLink] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setUserId(id);
            if (id && profile?.user_name) {
                setProfileLink(`${window.location.origin}/profile/${profile.user_name}`);
            }
        }
    }, [profile?.user_name]);

    useEffect(() => {
        if (!userId) {
            setProfileLoading(false);
            return;
        }
        async function fetchProfile() {
            try {
                // Check cache first
                const cached = getCachedData<ProfileData>("profile", userId);
                if (cached) {
                    setProfile(cached);
                    setProfileLoading(false);
                    // Still fetch in background to update cache
                    fetch(`/api/profile?user_id=${userId}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && !data.error) {
                                setCachedData("profile", userId, data);
                                setProfile(data);
                            }
                        })
                        .catch(() => {});
                    return;
                }

                setProfileLoading(true);
                setProfile(null);
                const res = await fetch(`/api/profile?user_id=${userId}`);
                const data = await res.json();
                if (res.ok && data) {
                    setProfile(data);
                    setCachedData("profile", userId, data);
                }
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
            const res = await fetch(
                `/api/users/search?query=${encodeURIComponent(searchTerm.trim())}`
            );
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

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!userId) return;
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        setAvatarError(null);

        try {
            const formData = new FormData();
            formData.append("avatar", file);
            formData.append("user_id", userId);

            const res = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Failed to upload profile picture");
            }

            setAvatarVersion((v) => v + 1);
        } catch (err: any) {
            console.error(err);
            setAvatarError(err.message || "Failed to upload profile picture");
        } finally {
            setAvatarUploading(false);
            if (e.target) e.target.value = "";
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

    const profileImageSrc =
        userId != null
            ? `/images/profile-${userId}.jpg?v=${avatarVersion}`
            : "/images/heart.jpg";

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex flex-col items-center py-10 px-4 relative overflow-hidden">

            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div
                className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.5s" }}
            ></div>

            <div className="glass-strong shadow-2xl p-8 w-full max-w-2xl text-center mb-8 rounded-3xl relative z-10">
                <div className="flex flex-col items-center space-y-5">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-rose-300/80 shadow-xl animate-pulse-glow">
                        <img
                            src={profileImageSrc}
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

                    {userId && (
                        <div className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="px-4 py-1.5 rounded-full text-xs font-medium bg-rose-50/80 border border-rose-200/70 text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                            >
                                {avatarUploading ? "Updating…" : "Change photo"}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            {avatarError && (
                                <p className="text-xs text-red-500 mt-1">{avatarError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        {profileLoading ? (
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                                Loading...
                            </h1>
                        ) : (
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                                {displayTitle}
                            </h1>
                        )}

                        <button
                            onClick={() => {
                                setRequestsModalOpen(true);
                                loadRequests();
                            }}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:from-rose-500 hover:to-pink-500 border-2 border-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 text-xl font-bold"
                            aria-label="Add partner"
                        >
                            +
                        </button>

                        {partnerFirstName && (
                            <button
                                onClick={() => setRemoveModalOpen(true)}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-rose-300 to-pink-300 text-rose-700 hover:from-rose-400 hover:to-pink-400 hover:text-white border-2 border-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 text-xl font-bold"
                                aria-label="Remove partner"
                            >
                                –
                            </button>
                        )}
                    </div>

                    <p className="text-rose-600/80 mt-2 text-lg italic">
                        {profile?.display_name
                            ? `"${profile.display_name}"`
                            : `"Making memories one date at a time 💕"`}
                    </p>

                    <div className="mt-6 flex items-center gap-4 justify-center">
                        <Link
                            href="/create-date"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <span className="text-xl">+</span>
                            <span>Add Date</span>
                        </Link>
                        {profile?.user_name && (
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-100 text-rose-700 px-6 py-3 font-semibold border-2 border-rose-200 hover:bg-rose-200 hover:scale-105 active:scale-95 transition-all duration-200"
                            >
                                <span>🔗</span>
                                <span>Share Profile</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                <DateGrid />
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-strong rounded-3xl p-6 max-w-md w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-rose-900">Share Profile</h2>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="text-2xl leading-none text-rose-400 hover:text-rose-600"
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-sm text-rose-600/70">
                            Share this link to let others view your public dates:
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={profileLink}
                                className="flex-1 px-4 py-2 rounded-xl border border-rose-200 bg-white/80 text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(profileLink);
                                    alert("Profile link copied to clipboard!");
                                    setShowShareModal(false);
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:from-rose-600 hover:to-pink-600 transition-all"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {requestsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-strong rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-slide-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                                Partner Requests
                            </h2>
                            <button
                                onClick={() => setRequestsModalOpen(false)}
                                className="text-rose-400 hover:text-rose-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 transition-all"
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
                                className="flex-1 border-2 border-rose-200/50 bg-white/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-rose-200/50 focus:border-rose-400 text-rose-900 placeholder:text-rose-300 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={searchLoading}
                                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
                            >
                                {searchLoading ? "..." : "Find"}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <ul className="max-h-40 overflow-y-auto space-y-2">
                                {searchResults.map((u) => (
                                    <li
                                        key={u.user_id}
                                        className="flex items-center justify-between border-2 border-rose-200/50 bg-white/60 rounded-xl px-4 py-3 hover:bg-white/80 transition-all"
                                    >
                    <span className="text-sm font-medium text-rose-800">
                      {u.username}
                    </span>
                                        <button
                                            onClick={() => handleSendRequest(u.username)}
                                            className="text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1.5 rounded-lg hover:from-rose-600 hover:to-pink-600 shadow-md hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Send
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <hr className="my-3" />

                        {requestsLoading ? (
                            <p className="text-rose-600/70 text-sm text-center py-4">
                                Loading requests...
                            </p>
                        ) : requestsError ? (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-red-600 text-sm">{requestsError}</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <p className="text-rose-600/70 text-sm text-center py-4">
                                No incoming requests.
                            </p>
                        ) : (
                            <ul className="max-h-40 overflow-y-auto space-y-2">
                                {requests.map((r) => (
                                    <li
                                        key={r.notification_id}
                                        className="flex items-center justify-between border-2 border-rose-200/50 bg-white/60 rounded-xl px-4 py-3 hover:bg-white/80 transition-all"
                                    >
                    <span className="text-sm font-medium text-rose-800">
                      {r.from_username}
                    </span>
                                        <button
                                            onClick={() => handleAcceptRequest(r.notification_id)}
                                            className="text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1.5 rounded-lg hover:from-rose-600 hover:to-pink-600 shadow-md hover:scale-105 active:scale-95 transition-all"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-strong rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-slide-in">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                            Remove Partner
                        </h2>
                        <p className="text-rose-600/80 text-sm">
                            Are you sure you want to remove your current partner?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRemoveModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border-2 border-rose-200/50 text-rose-700 text-sm font-semibold hover:bg-rose-50/50 transition-all disabled:opacity-60"
                                disabled={removeLoading}
                            >
                                No
                            </button>
                            <button
                                onClick={handleRemovePartner}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
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
