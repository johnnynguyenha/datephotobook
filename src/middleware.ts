import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
    "/",
    "/login",
    "/signin",
    "/register",
    "/signup",
    "/forgot",
    "/forgot-password",
    "/reset",
    "/verify",
    "/dashboard",
    "/api",
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
];

function isPublic(pathname: string) {
    return PUBLIC_PREFIXES.some((p) =>
        pathname === p || pathname.startsWith(p + "/")
    );
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (isPublic(pathname)) return NextResponse.next();

    const authed = req.cookies.get("auth")?.value === "1";
    if (!authed) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: "/:path*",
};
