"use client";

const CARD_CLASS =
    "bg-white/85 backdrop-blur-md shadow-lg rounded-2xl border border-rose-100";

type Notification = {
    id: string;
    title: string;
    message: string;
    timeAgo: string;
    type: "reminder" | "upload" | "partner";
    unread?: boolean;
};

const NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        title: "Sunset picnic is coming up",
        message: "You set a memory for Friday at 6:00pm. Bring the disposable camera!",
        timeAgo: "2h ago",
        type: "reminder",
        unread: true,
    },
    {
        id: "2",
        title: "Alex added 6 new photos",
        message: "Check out the shots from your Newport adventure.",
        timeAgo: "Yesterday",
        type: "upload",
    },
    {
        id: "3",
        title: "Share your reflection",
        message: "Add a note to last week’s concert date so it stays fresh.",
        timeAgo: "3d ago",
        type: "partner",
    },
];

const TYPE_COLORS: Record<Notification["type"], string> = {
    reminder: "bg-rose-100 text-rose-600 ring-rose-200",
    upload: "bg-sky-100 text-sky-600 ring-sky-200",
    partner: "bg-amber-100 text-amber-600 ring-amber-200",
};

export default function NotificationsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 px-4 py-10 flex justify-center">
            <div className="w-full max-w-3xl space-y-6">
                <header className={`${CARD_CLASS} p-6`}>
                    <h1 className="text-3xl font-semibold text-rose-700">Notifications</h1>
                    <p className="text-gray-600 mt-1">
                        Gentle nudges to help you save memories, stay synced, and never miss a date.
                    </p>
                </header>

                <section className={`${CARD_CLASS} p-6`}>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <button className="rounded-full bg-rose-600 text-white px-4 py-1.5 text-sm font-medium shadow">
                            Mark all read
                        </button>
                        <span className="text-sm text-gray-500">
                            {NOTIFICATIONS.filter((n) => n.unread).length} unread
                        </span>
                    </div>
                    <ul className="space-y-4">
                        {NOTIFICATIONS.map((item) => (
                            <li
                                key={item.id}
                                className={`p-4 rounded-xl border border-rose-100 flex gap-4 ${item.unread ? "bg-white" : "bg-white/70"}`}
                            >
                                <span
                                    className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ${TYPE_COLORS[item.type]}`}
                                >
                                    {item.type === "reminder" && "⏰"}
                                    {item.type === "upload" && "📷"}
                                    {item.type === "partner" && "💬"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">{item.title}</h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{item.timeAgo}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                                    {item.unread && (
                                        <span className="inline-flex items-center gap-1 text-xs text-rose-500 mt-2">
                                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                                            New
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    );
}
