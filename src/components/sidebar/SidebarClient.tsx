"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

export type NavCounts = {
    dates?: number;
    photos?: number;
    albums?: number;
    notifications?: number;
};

type Item = { label: string; href: string; badgeKey?: keyof NavCounts };

const NAV_SECTIONS: { title?: string; items: Item[] }[] = [
    {
        items: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Create Date", href: "/dates/create" },
        ],
    },
    {
        title: "Library",
        items: [
            { label: "Dates", href: "/dates", badgeKey: "dates" },
            { label: "Photos", href: "/photos", badgeKey: "photos" },
            { label: "Albums", href: "/albums", badgeKey: "albums" },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Profile", href: "/profile" },
            { label: "Settings", href: "/settings" },
            { label: "Notifications", href: "/notifications", badgeKey: "notifications" },
            // href can be anything; we'll intercept by label
            { label: "Sign out", href: "#" },
        ],
    },
];


export default function SidebarClient({ counts }: { counts?: NavCounts }) {
    const pathname = usePathname() || "/";

    const [open, setOpen] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("sidebar:open");
            if (saved === null) {
                localStorage.setItem("sidebar:open", "1");
                setOpen(true);
            } else {
                setOpen(saved !== "0");
            }
        } catch {
            setOpen(true);
        }
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        try { localStorage.setItem("sidebar:open", next ? "1" : "0"); } catch {}
    };

    useEffect(() => {
        const isAuth = ["/login", "/signin", "/register", "/signup", "/forgot", "/reset", "/verify"]
            .some(p => pathname === p || pathname.startsWith(p + "/"));
        if (!isAuth) {
            try {
                const saved = localStorage.getItem("sidebar:open");
                if (saved === "0") return;
                setOpen(true);
                localStorage.setItem("sidebar:open", "1");
            } catch {}
        }
    }, [pathname]);

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
                className="fixed top-3 left-3 z-50 p-2 rounded-md bg-white border shadow-sm hover:bg-gray-100 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <aside
                className={clsx(
                    "fixed top-0 left-0 z-40 h-full w-64 bg-white border-r transition-transform duration-300",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-4 pt-12">
                    <Link href="/" className="block text-xl font-bold tracking-tight truncate" title="Date Photo Book">
                        Date Photo Book
                    </Link>
                    <p className="text-sm text-gray-500">Capture every date.</p>
                </div>

                <div className="flex-1 overflow-y-auto px-3 mt-4 space-y-6">
                    {NAV_SECTIONS.map((section, idx) => (
                        <div key={idx}>
                            {section.title && (
                                <div className="mb-2 px-1 text-[11px] font-semibold uppercase text-gray-500">
                                    {section.title}
                                </div>
                            )}
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                                    const badge = item.badgeKey && counts?.[item.badgeKey] ? counts[item.badgeKey] : null;

                                    if (item.label === "Sign out") {
                                        return (
                                            <li key="signout">
                                                <button
                                                    type="button"
                                                    onClick={handleSignOut}
                                                    className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400 flex-none" />
                                                        <span className="truncate">Sign out</span>
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
                                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                                                    active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                                                )}
                                                onClick={() => setOpen(false)}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                          <span
                              className={clsx(
                                  "inline-block h-2.5 w-2.5 rounded-full flex-none",
                                  active ? "bg-white" : "bg-gray-400"
                              )}
                              aria-hidden
                          />
                                                    <span className="truncate">{item.label}</span>
                                                </div>
                                                {badge ? (
                                                    <span
                                                        className={clsx(
                                                            "ml-3 inline-flex min-w-6 items-center justify-center rounded-full px-2 text-xs",
                                                            active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
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
        </>
    );
}
