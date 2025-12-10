"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthed } from "@/lib/auth";

const PUBLIC_PREFIXES = [
    "/login",
    "/signin",
    "/register",
    "/signup",
    "/forgot",
    "/forgot-password",
    "/reset",
    "/verify",
    "/",
];

function isPublicPath(pathname: string) {
    return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export default function AuthRouteGuard() {
    const pathname = usePathname() || "/";
    const router = useRouter();

    useEffect(() => {
        if (!isPublicPath(pathname) && !isAuthed()) {
            router.replace("/login");
        }
    }, [pathname, router]);

    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted && !isPublicPath(pathname) && !isAuthed()) {
                router.replace("/login");
            }
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, [pathname, router]);

    useEffect(() => {
        const onAuthChange = () => {
            if (!isPublicPath(pathname) && !isAuthed()) {
                router.replace("/login");
            }
        };
        window.addEventListener("authchange", onAuthChange as EventListener);
        return () => window.removeEventListener("authchange", onAuthChange as EventListener);
    }, [pathname, router]);

    return null;
}
