import type { ReactNode } from "react";
import "./globals.css";

import AuthRouteGuard from "@/components/auth/AuthRouteGuard";
import AuthSidebarGate from "@/components/auth/AuthSidebarGate";
import SidebarClient from "@/components/sidebar/SidebarClient";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <body className="h-screen">
        <AuthRouteGuard />
        <AuthSidebarGate>
            <SidebarClient />
        </AuthSidebarGate>

        {children}
        </body>
        </html>
    );
}
