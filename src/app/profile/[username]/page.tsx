"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DateGrid from "@/components/DateGrid";

type ProfileData = {
    user_id?: string;
    user_name: string;
    partner_name?: string | null;
    display_name?: string | null;
    theme_setting?: string | null;
};

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params?.username as string;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profileLink, setProfileLink] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("userId");
            setCurrentUserId(id);
            setProfileLink(`${window.location.origin}/profile/${username}`);
        }
    }, [username]);

    useEffect(() => {
        if (!username) {
            setProfileLoading(false);
            setError("Username is required");
            return;
        }

        async function fetchProfile() {
            try {
                setProfileLoading(true);
                setError(null);

                const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "User not found");
                }

                setProfile(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load profile");
            } finally {
                setProfileLoading(false);
            }
        }

        fetchProfile();
    }, [username]);

    if (profileLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center">
                <p className="text-rose-600/70">Loading profile...</p>
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center">
                <div className="glass-strong rounded-3xl p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold text-rose-700 mb-4">Profile Not Found</h1>
                    <p className="text-rose-600/70 mb-6">{error || "This profile does not exist."}</p>
                    <Link
                        href="/profile"
                        className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:from-rose-600 hover:to-pink-600 transition-all"
                    >
                        Go to My Profile
                    </Link>
                </div>
            </main>
        );
    }

    const isOwnProfile = currentUserId === profile.user_id;

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 py-10 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div
                className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1.5s" }}
            ></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="glass-strong shadow-2xl rounded-3xl p-8 mb-8 animate-slide-in">
                    <div className="flex flex-col items-center mb-6">
                        {profile.user_id && (
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-rose-300/80 shadow-xl mb-4">
                                <img
                                    src={`/images/profile-${profile.user_id}.jpg`}
                                    alt={`${profile.user_name}'s profile`}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (!img.src.endsWith("/images/heart.jpg")) {
                                            img.src = "/images/heart.jpg";
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <div className="w-full flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                                    {profile.user_name}
                                </h1>
                                {profile.partner_name && (
                                    <p className="text-rose-600/70 text-sm">
                                        Partner: {profile.partner_name}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {isOwnProfile ? (
                                    <Link
                                        href="/profile"
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:from-rose-600 hover:to-pink-600 transition-all"
                                    >
                                        Edit My Profile
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={profileLink}
                                            className="px-4 py-2 rounded-xl border border-rose-200 bg-white/80 text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-200 max-w-xs"
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(profileLink);
                                                alert("Profile link copied to clipboard!");
                                            }}
                                            className="px-4 py-2 rounded-xl bg-rose-100 text-rose-700 font-semibold hover:bg-rose-200 transition-all"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 w-full max-w-5xl">
                    <DateGrid username={username} publicView={true} />
                </div>
            </div>
        </main>
    );
}

