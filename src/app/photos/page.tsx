"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCachedData, setCachedData } from "@/lib/cache";

type PhotoItem = {
    photo_id: string;
    date_id: string;
    user_id: string;
    file_path: string;
    description: string | null;
    uploaded_at: string;
    date_title: string | null;
    date_time: string;
    date_location: string | null;
};

export default function PhotosPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

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
            if (!userId) return;
            try {
                // Check cache first
                const cached = getCachedData<PhotoItem[]>("photos", userId);
                if (cached && isMounted) {
                    setPhotos(cached);
                    setLoading(false);
                    // Still fetch in background to update cache
                    fetch(`/api/photos?user_id=${encodeURIComponent(userId)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && !data.error && Array.isArray(data) && isMounted && userId) {
                                setCachedData("photos", userId, data);
                                setPhotos(data);
                            }
                        })
                        .catch(() => {});
                    return;
                }

                setLoading(true);
                setError(null);

                const res = await fetch(`/api/photos?user_id=${encodeURIComponent(userId)}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load photos");
                }

                if (isMounted && userId) {
                    setPhotos(data);
                    setCachedData("photos", userId, data);
                }
            } catch (err: any) {
                console.error(err);
                if (isMounted) setError(err.message || "Failed to load photos");
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
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex flex-col items-center py-10 px-4 relative overflow-hidden">
            {/* background decoration */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
            
            <div className="glass-strong shadow-2xl p-8 w-full max-w-4xl mb-8 rounded-3xl relative z-10 animate-slide-in">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    My Photos
                </h1>
                <p className="text-rose-600/70 text-sm">
                    All the photos you&apos;ve uploaded so far.
                </p>
            </div>

            {loading ? (
                <div className="relative z-10">
                    <p className="text-rose-600/70 mt-4 text-center">Loading photos...</p>
                </div>
            ) : error ? (
                <div className="relative z-10 p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-600">{error}</p>
                </div>
            ) : photos.length === 0 ? (
                <div className="relative z-10 glass-strong p-8 rounded-3xl text-center">
                    <p className="text-rose-600/70 text-lg">You don&apos;t have any photos yet.</p>
                    <p className="text-rose-500/60 text-sm mt-2">Create a date and upload photos to get started! 💕</p>
                    <Link
                        href="/create-date"
                        className="inline-block mt-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        Create Date
                    </Link>
                </div>
            ) : (
                <section className="w-full max-w-6xl grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 relative z-10">
                    {photos.map((photo, index) => {
                        const raw = photo.file_path?.toString().trim();
                        let imageSrc = "/images/heart.jpg";
                        if (raw && raw !== "null" && raw !== "undefined") {
                            imageSrc = raw.startsWith("/") ? raw : `/images/${raw}`;
                        }

                        return (
                            <div
                                key={photo.photo_id}
                                className="glass-strong rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] animate-slide-in cursor-pointer group"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <div className="relative w-full aspect-square overflow-hidden">
                                    <img
                                        src={imageSrc}
                                        alt={photo.description || photo.date_title || "Photo"}
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            if (!img.src.endsWith("/images/heart.jpg")) {
                                                img.src = "/images/heart.jpg";
                                            }
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {photo.date_title && (
                                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                            {photo.date_title}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            {/* photo stuff */}
            {selectedPhoto && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div 
                        className="glass-strong rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-in relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all text-xl font-bold"
                        >
                            ×
                        </button>
                        
                        <div className="flex flex-col md:flex-row max-h-[90vh]">
                            <div className="flex-1 relative aspect-square md:aspect-auto md:h-[90vh] bg-black/50">
                                <img
                                    src={(() => {
                                        const raw = selectedPhoto.file_path?.toString().trim();
                                        if (!raw || raw === "null" || raw === "undefined") {
                                            return "/images/heart.jpg";
                                        }
                                        return raw.startsWith("/") ? raw : `/images/${raw}`;
                                    })()}
                                    alt={selectedPhoto.description || selectedPhoto.date_title || "Photo"}
                                    className="object-contain w-full h-full"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (!img.src.endsWith("/images/heart.jpg")) {
                                            img.src = "/images/heart.jpg";
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="w-full md:w-80 p-6 overflow-y-auto bg-white/95">
                                <div className="space-y-4">
                                    {selectedPhoto.date_title && (
                                        <div>
                                            <h2 className="text-2xl font-bold text-rose-700 mb-1">
                                                {selectedPhoto.date_title}
                                            </h2>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2 text-sm">
                                        <p className="text-rose-600/70">
                                            <span className="font-semibold">Date:</span>{" "}
                                            {new Date(selectedPhoto.date_time).toLocaleDateString()}
                                        </p>
                                        {selectedPhoto.date_location && (
                                            <p className="text-rose-600/70 flex items-center gap-1">
                                                <span>📍</span>
                                                <span>{selectedPhoto.date_location}</span>
                                            </p>
                                        )}
                                        <p className="text-rose-600/70">
                                            <span className="font-semibold">Uploaded:</span>{" "}
                                            {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    
                                    {selectedPhoto.description && (
                                        <div>
                                            <p className="text-rose-700 leading-relaxed">
                                                {selectedPhoto.description}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <Link
                                        href={`/dates`}
                                        className="inline-block mt-4 text-rose-600 hover:text-rose-700 font-semibold underline decoration-2 underline-offset-2 transition-colors"
                                    >
                                        View Date →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
