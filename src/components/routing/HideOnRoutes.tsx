"use client";

import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

const HIDE_PREFIXES = [
    "/login",
    "/register",
    "/signup",
    "/signin",
    "/forgot",
    "/reset",
    "/verify",
];

export default function HideOnRoutes({ children }: PropsWithChildren) {
    const pathname = usePathname() || "/";
    const shouldHide = HIDE_PREFIXES.some((p) =>
        pathname === p || pathname.startsWith(p + "/")
    );
    if (shouldHide) return null;
    return <>{children}</>;
}
