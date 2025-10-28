"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function isAuthed(): boolean {
    try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const userRaw = localStorage.getItem("user");
        return Boolean((token && userId) || userRaw);
    } catch {
        return false;
    }
}

export default function AuthSidebarGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        setAllowed(isAuthed());
    }, []);

    useEffect(() => {
        setAllowed(isAuthed());
    }, [pathname]);

    useEffect(() => {
        const onStorage = () => setAllowed(isAuthed());
        const onAuthChange = () => setAllowed(isAuthed());

        window.addEventListener("storage", onStorage);
        window.addEventListener("authchange", onAuthChange as EventListener);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("authchange", onAuthChange as EventListener);
        };
    }, []);

    if (allowed === null) return null;
    if (!allowed) return null;
    return <>{children}</>;
}
