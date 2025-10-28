"use client";

import { useRouter } from "next/navigation";
import { isAuthed } from "@/lib/auth";

type Props = {
    authedFallback?: string;
    unauthRedirect?: string;
    children?: React.ReactNode;
    className?: string;
};

export default function BackButton({
                                       authedFallback = "/profile",
                                       unauthRedirect = "/login",
                                       children = "Back",
                                       className = "text-gray-500 underline text-sm",
                                   }: Props) {
    const router = useRouter();

    const handleBack = () => {
        if (!isAuthed()) {
            // must re-login
            window.dispatchEvent(new Event("authchange"));
            router.push(unauthRedirect);
            return;
        }

        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push(authedFallback);
        }
    };

    return (
        <button type="button" onClick={handleBack} className={className}>
            {children}
        </button>
    );
}
