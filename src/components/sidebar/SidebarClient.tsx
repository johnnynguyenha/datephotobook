"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

export type NavCounts = {
    dates?: number;
    photos?: number;
    notifications?: number;
};

type Item = { label: string; href: string; badgeKey?: keyof NavCounts };

const NAV_SECTIONS: { title?: string; items: Item[] }[] = [
    {
        items: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Create Date", href: "/create-date" },
        ],
    },
    {
        title: "Library",
        items: [
            { label: "Dates", href: "/dates", badgeKey: "dates" },
            { label: "Photos", href: "/photos", badgeKey: "photos" },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Profile", href: "/profile" },
            { label: "Settings", href: "/settings" },
            { label: "Notifications", href: "/notifications", badgeKey: "notifications" },
            { label: "Sign out", href: "#" },
        ],
    },
];

export default function SidebarClient({ counts }: { counts?: NavCounts }) {
    const pathname = usePathname() || "/";

    const [open, setOpen] = useState(() => {
        if (typeof window === "undefined") return true;
        try {
            const saved = localStorage.getItem("sidebar:open");
            if (saved === null) {
                localStorage.setItem("sidebar:open", "1");
                return true;
            }
            return saved !== "0";
        } catch {
            return true;
        }
    });

    const [sidebarWidth, setSidebarWidth] = useState<string>("280px");

    const toggle = () => {
        const next = !open;
        setOpen(next);
        try {
            localStorage.setItem("sidebar:open", next ? "1" : "0");
        } catch {}
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const updateWidth = () => {
            const w = window.innerWidth;

            let width: string;
            if (w <= 480) {
                // tiny window – use a big percentage
                width = `${Math.round(w * 0.8)}px`;
            } else if (w <= 900) {
                width = `${Math.round(w * 0.25)}px`;
            } else {
                width = `${Math.min(320, Math.round(w * 0.2))}px`;
            }

            setSidebarWidth(width);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleSignOut = () => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("user");
            document.cookie = "auth=; Path=/; Max-Age=0; SameSite=Lax";
        } catch {}
        window.dispatchEvent(new Event("authchange"));
        window.location.replace("/login");
    };

    return (
        <>
            <button
                onClick={toggle}
                aria-label="Toggle sidebar"
                aria-expanded={open}
                className="fixed top-4 left-4 z-50 p-2.5 rounded-xl glass-strong shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-rose-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <aside
                style={{ width: sidebarWidth, maxWidth: "90vw" }}
                className={clsx(
                    "fixed top-0 left-0 z-40 h-screen glass-strong border-r border-rose-100/50 transition-all duration-300 ease-out shadow-xl flex flex-col",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 pt-16 border-b border-rose-100/50 flex-none">
                    <Link
                        href="/profile"
                        className="block group"
                    >
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                            Date Photo Book
                        </h1>
                        <p className="text-sm text-rose-400/70 mt-1 flex items-center gap-1">
                            <span>💕</span> Capture every date
                        </p>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {NAV_SECTIONS.map((section, idx) => (
                        <div key={idx} className="animate-slide-in" style={{ animationDelay: `${idx * 50}ms` }}>
                            {section.title && (
                                <div className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-rose-400/60">
                                    {section.title}
                                </div>
                            )}

                            <ul className="space-y-1.5">
                                {section.items.map((item) => {
                                    const active =
                                        pathname === item.href ||
                                        pathname.startsWith(item.href + "/");
                                    const badge =
                                        item.badgeKey && counts?.[item.badgeKey]
                                            ? counts[item.badgeKey]
                                            : null;

                                    if (item.label === "Sign out") {
                                        return (
                                            <li key="signout">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLogoutConfirm(true)}
                                                    className="w-full text-left flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-rose-600/80 hover:bg-rose-50/70 hover:text-rose-700 transition-all duration-200 group"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-rose-300 group-hover:bg-rose-400 flex-none" />
                                                        <span className="truncate font-medium">Sign out</span>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                title={item.label}
                                                className={clsx(
                                                    "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-all duration-200 group",
                                                    active
                                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200/50 scale-[1.02]"
                                                        : "text-rose-700/70 hover:bg-rose-50/70 hover:text-rose-800"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span
                                                        className={clsx(
                                                            "inline-block h-2 w-2 rounded-full flex-none transition-all",
                                                            active
                                                                ? "bg-white"
                                                                : "bg-rose-300/50 group-hover:bg-rose-400"
                                                        )}
                                                        aria-hidden
                                                    />
                                                    <span className="truncate font-medium">{item.label}</span>
                                                </div>
                                                {badge ? (
                                                    <span
                                                        className={clsx(
                                                            "ml-3 inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                                            active
                                                                ? "bg-white/30 text-white"
                                                                : "bg-rose-100 text-rose-600 group-hover:bg-rose-200"
                                                        )}
                                                    >
                                                        {badge}
                                                    </span>
                                                ) : null}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </aside>

            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-strong rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-slide-in">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                            Sign Out
                        </h2>
                        <p className="text-rose-600/80 text-sm">
                            Are you sure you want to sign out?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-5 py-2.5 rounded-xl border-2 border-rose-200/50 text-rose-700 text-sm font-semibold hover:bg-rose-50/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200/50 hover:scale-105 active:scale-95 transition-all"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
