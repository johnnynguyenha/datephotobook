"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DateItem = {
    date_id: string;
    title: string | null;
    description: string | null;
    date_time: string;
    location: string | null;
    privacy: "PUBLIC" | "PRIVATE" | "INHERIT";
    image_path?: string | null;
};

type PhotoItem = {
    photo_id: string;
    file_path: string;
    date_title: string | null;
    uploaded_at: string;
};

type ProfileData = {
    user_name: string;
    partner_name?: string | null;
    display_name?: string | null;
};

type Stats = {
    totalDates: number;
    totalPhotos: number;
    upcomingDates: number;
    publicDates: number;
    privateDates: number;
};

export default function DashboardPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [recentDates, setRecentDates] = useState<DateItem[]>([]);
    const [recentPhotos, setRecentPhotos] = useState<PhotoItem[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalDates: 0,
        totalPhotos: 0,
        upcomingDates: 0,
        publicDates: 0,
        privateDates: 0,
    });
    const [loading, setLoading] = useState(true);

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

        async function loadDashboardData() {
            try {
                setLoading(true);

                // Fetch all data in parallel
                const [profileRes, datesRes, photosRes] = await Promise.all([
                    fetch(`/api/profile?user_id=${userId}`),
                    fetch(`/api/dates?user_id=${userId}`),
                    fetch(`/api/photos?user_id=${userId}`),
                ]);

                // Process profile
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfile(profileData);
                }

                // Process dates
                if (datesRes.ok) {
                    const datesData: DateItem[] = await datesRes.json();
                    const myDates = datesData.filter((d) => d.date_id);
                    
                    // Sort by date_time descending for recent
                    const sorted = [...myDates].sort(
                        (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
                    );
                    setRecentDates(sorted.slice(0, 4));

                    // Calculate stats
                    const now = new Date();
                    const upcoming = myDates.filter((d) => new Date(d.date_time) > now);
                    const publicDates = myDates.filter((d) => d.privacy === "PUBLIC");
                    const privateDates = myDates.filter((d) => d.privacy === "PRIVATE");

                    setStats((prev) => ({
                        ...prev,
                        totalDates: myDates.length,
                        upcomingDates: upcoming.length,
                        publicDates: publicDates.length,
                        privateDates: privateDates.length,
                    }));
                }

                // Process photos
                if (photosRes.ok) {
                    const photosData: PhotoItem[] = await photosRes.json();
                    const sorted = [...photosData].sort(
                        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
                    );
                    setRecentPhotos(sorted.slice(0, 6));
                    setStats((prev) => ({ ...prev, totalPhotos: photosData.length }));
                }
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, [userId]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getImageSrc = (path?: string | null) => {
        const raw = path?.toString().trim();
        if (!raw || raw === "null" || raw === "undefined") {
            return "/images/heart.jpg";
        }
        return raw.startsWith("/") ? raw : `/images/${raw}`;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center">
                <div className="text-rose-600/70 text-lg animate-pulse">Loading dashboard...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 py-10 px-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }}></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-rose-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "0.75s" }}></div>

            <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                {/* Welcome Header */}
                <section className="glass-strong shadow-2xl p-8 rounded-3xl animate-slide-in">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                                {getGreeting()}, {profile?.display_name || profile?.user_name || "there"}! 💕
                            </h1>
                            <p className="text-rose-600/70 mt-2">
                                {profile?.partner_name 
                                    ? `Making memories with ${profile.partner_name}` 
                                    : "Ready to capture some beautiful moments?"
                                }
                            </p>
                        </div>
                        <Link
                            href="/create-date"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Date
                        </Link>
                    </div>
                </section>

                {/* Stats Cards */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-in" style={{ animationDelay: "100ms" }}>
                    <div className="glass-strong rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-500/60 text-sm font-medium">Total Dates</p>
                                <p className="text-3xl font-bold text-rose-700 mt-1">{stats.totalDates}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">💝</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-500/60 text-sm font-medium">Total Photos</p>
                                <p className="text-3xl font-bold text-rose-700 mt-1">{stats.totalPhotos}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📸</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-500/60 text-sm font-medium">Upcoming</p>
                                <p className="text-3xl font-bold text-rose-700 mt-1">{stats.upcomingDates}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📅</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-500/60 text-sm font-medium">Shared</p>
                                <p className="text-3xl font-bold text-rose-700 mt-1">{stats.publicDates}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🌍</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="glass-strong rounded-3xl p-6 shadow-xl animate-slide-in" style={{ animationDelay: "150ms" }}>
                    <h2 className="text-xl font-bold text-rose-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link
                            href="/create-date"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/50 hover:border-rose-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-rose-700">New Date</span>
                        </Link>

                        <Link
                            href="/dates"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/50 hover:border-rose-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-rose-700">View Dates</span>
                        </Link>

                        <Link
                            href="/photos"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/50 hover:border-rose-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-rose-700">Gallery</span>
                        </Link>

                        <Link
                            href="/profile"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/50 hover:border-rose-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-rose-700">Profile</span>
                        </Link>
                    </div>
                </section>

                {/* Main Content Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Recent Dates */}
                    <section className="glass-strong rounded-3xl p-6 shadow-xl animate-slide-in" style={{ animationDelay: "200ms" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-rose-800">Recent Dates</h2>
                            <Link href="/dates" className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors">
                                View all →
                            </Link>
                        </div>

                        {recentDates.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-rose-500/60 mb-4">No dates yet!</p>
                                <Link
                                    href="/create-date"
                                    className="text-sm text-rose-500 hover:text-rose-600 font-medium"
                                >
                                    Create your first date →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentDates.map((date, index) => (
                                    <Link
                                        key={date.date_id}
                                        href="/dates"
                                        className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-rose-50/50 to-pink-50/50 border border-rose-100/50 hover:border-rose-200 hover:shadow-md transition-all duration-300 group"
                                        style={{ animationDelay: `${250 + index * 50}ms` }}
                                    >
                                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                            <img
                                                src={getImageSrc(date.image_path)}
                                                alt={date.title || "Date"}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    if (!img.src.endsWith("/images/heart.jpg")) {
                                                        img.src = "/images/heart.jpg";
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-rose-800 truncate">
                                                {date.title || "Untitled Date"}
                                            </h3>
                                            <p className="text-xs text-rose-500/60 mt-0.5">
                                                {formatDate(date.date_time)}
                                                {date.location && ` · ${date.location}`}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            date.privacy === "PRIVATE" 
                                                ? "bg-rose-100/50 text-rose-600" 
                                                : "bg-pink-100/50 text-pink-600"
                                        }`}>
                                            {date.privacy === "PRIVATE" ? "🔒" : "🌍"}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Recent Photos */}
                    <section className="glass-strong rounded-3xl p-6 shadow-xl animate-slide-in" style={{ animationDelay: "250ms" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-rose-800">Recent Photos</h2>
                            <Link href="/photos" className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors">
                                View all →
                            </Link>
                        </div>

                        {recentPhotos.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-rose-500/60 mb-4">No photos yet!</p>
                                <Link
                                    href="/create-date"
                                    className="text-sm text-rose-500 hover:text-rose-600 font-medium"
                                >
                                    Add photos to a date →
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {recentPhotos.map((photo, index) => (
                                    <Link
                                        key={photo.photo_id}
                                        href="/photos"
                                        className="aspect-square rounded-xl overflow-hidden group"
                                        style={{ animationDelay: `${300 + index * 50}ms` }}
                                    >
                                        <img
                                            src={getImageSrc(photo.file_path)}
                                            alt={photo.date_title || "Photo"}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                const img = e.currentTarget;
                                                if (!img.src.endsWith("/images/heart.jpg")) {
                                                    img.src = "/images/heart.jpg";
                                                }
                                            }}
                                        />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Partner Status Card */}
                <section className="glass-strong rounded-3xl p-6 shadow-xl animate-slide-in" style={{ animationDelay: "300ms" }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-2xl animate-pulse-glow">
                                💑
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-rose-800">Partner Status</h2>
                                {profile?.partner_name ? (
                                    <p className="text-rose-600/70">
                                        Connected with <span className="font-semibold text-rose-600">{profile.partner_name}</span>
                                    </p>
                                ) : (
                                    <p className="text-rose-500/60">No partner connected yet</p>
                                )}
                            </div>
                        </div>
                        <Link
                            href="/profile"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 px-5 py-2.5 font-medium border border-rose-200/50 hover:border-rose-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        >
                            {profile?.partner_name ? "View Partner" : "Add Partner"}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </section>

                {/* Tips Card */}
                <section className="glass-strong rounded-3xl p-6 shadow-xl animate-slide-in" style={{ animationDelay: "350ms" }}>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                            💡
                        </div>
                        <div>
                            <h3 className="font-bold text-rose-800">Pro Tip</h3>
                            <p className="text-rose-600/70 text-sm mt-1">
                                {stats.totalDates === 0
                                    ? "Start by creating your first date! Add a title, description, and a beautiful photo to capture the moment."
                                    : stats.totalPhotos === 0
                                    ? "Add some photos to your dates to make your memories more vivid and special!"
                                    : !profile?.partner_name
                                    ? "Connect with your partner to share dates and photos together. Go to your Profile to send a partner request!"
                                    : "Keep adding dates and photos to build your beautiful collection of memories together! 💕"
                                }
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
