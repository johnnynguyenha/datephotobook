"use client";

import { useState } from "react";

type ToggleKey = "email" | "sms" | "push" | "digest";

const CARD_CLASS =
    "bg-white/85 backdrop-blur-md shadow-lg rounded-2xl border border-rose-100";

export default function SettingsPage() {
    const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
        email: true,
        sms: false,
        push: true,
        digest: false,
    });

    const toggle = (key: ToggleKey) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 px-4 py-10 flex justify-center">
            <div className="w-full max-w-4xl space-y-6">
                <header className={`${CARD_CLASS} p-6`}>
                    <h1 className="text-3xl font-semibold text-rose-700">Settings</h1>
                    <p className="text-gray-600 mt-1">
                        Adjust how Date Photo Book keeps you informed and personalise your space.
                    </p>
                </header>

                <section className={`${CARD_CLASS} p-6`}>
                    <h2 className="text-xl font-semibold text-gray-900">Profile Snapshot</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        These basics come from your signup details. Editing is coming soon.
                    </p>
                    <dl className="grid gap-4 sm:grid-cols-2 text-sm text-gray-700">
                        <div>
                            <dt className="font-medium text-gray-500">Name</dt>
                            <dd className="text-gray-800">You + Your Person</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Email</dt>
                            <dd className="text-gray-800">couple@example.com</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Partner Link</dt>
                            <dd className="text-gray-800">Pending confirmation</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Plan</dt>
                            <dd className="text-gray-800">Free memories</dd>
                        </div>
                    </dl>
                </section>

                <section className={`${CARD_CLASS} p-6`}>
                    <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Pick how we nudge you about upcoming dates, uploads, or partner activity.
                    </p>
                    <ul className="space-y-3">
                        {(() => {
                            const NOTIFICATION_OPTIONS: { key: ToggleKey; label: string; detail: string }[] = [
                                { key: "email", label: "Email reminders", detail: "Weekly wrap-ups and important alerts." },
                                { key: "sms", label: "Text messages", detail: "Last-minute date reminders straight to your phone." },
                                { key: "push", label: "Push notifications", detail: "Instant updates in the browser or app." },
                                { key: "digest", label: "Monthly digest", detail: "A highlight reel every month." },
                            ];
                            return NOTIFICATION_OPTIONS.map(({ key, label, detail }) => (
                                <li key={key} className="flex items-center justify-between rounded-xl border border-rose-100 px-4 py-3">
                                    <div>
                                        <p className="font-medium text-gray-800">{label}</p>
                                        <p className="text-sm text-gray-500">{detail}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggle(key)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                            toggles[key] ? "bg-rose-500" : "bg-gray-300"
                                        }`}
                                        aria-pressed={toggles[key]}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                toggles[key] ? "translate-x-5" : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </li>
                            ));
                        })()}
                    </ul>
                </section>

                <section className={`${CARD_CLASS} p-6`}>
                    <h2 className="text-xl font-semibold text-gray-900">Memory Retention</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Decide how long we keep archived photos and drafts before we prompt you.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { label: "Photo backup", value: "Forever" },
                            { label: "Draft dates", value: "30 days" },
                            { label: "Shared albums", value: "Until both remove" },
                            { label: "Download format", value: "High quality JPG" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-rose-100 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                                <p className="text-lg font-semibold text-gray-800">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
