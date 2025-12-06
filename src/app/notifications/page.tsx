"use client";

const CARD_CLASS =
    "glass-strong shadow-xl rounded-3xl border border-rose-100/50";

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
        message: "Add a note to last week's concert date so it stays fresh.",
        timeAgo: "3d ago",
        type: "partner",
    },
];

const TYPE_COLORS: Record<Notification["type"], string> = {
    reminder: "bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 ring-rose-200",
    upload: "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600 ring-sky-200",
    partner: "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600 ring-amber-200",
};

export default function NotificationsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 py-10 flex justify-center relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
            
            <div className="w-full max-w-3xl space-y-6 relative z-10">
                <header className={`${CARD_CLASS} p-8 animate-slide-in`}>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        Notifications
                    </h1>
                    <p className="text-rose-600/70 mt-1">
                        Gentle nudges to help you save memories, stay synced, and never miss a date.
                    </p>
                </header>

                <section className={`${CARD_CLASS} p-8 animate-slide-in`} style={{ animationDelay: '100ms' }}>
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <button className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-rose-200/50 hover:from-rose-600 hover:to-pink-600 hover:scale-105 active:scale-95 transition-all">
                            Mark all read
                        </button>
                        <span className="text-sm text-rose-600/70 font-medium">
                            {NOTIFICATIONS.filter((n) => n.unread).length} unread
                        </span>
                    </div>
                    <ul className="space-y-4">
                        {NOTIFICATIONS.map((item, index) => (
                            <li
                                key={item.id}
                                className={`p-5 rounded-2xl border-2 flex gap-4 transition-all hover:scale-[1.01] animate-slide-in ${
                                    item.unread
                                        ? "bg-white border-rose-300/50 shadow-md"
                                        : "bg-white/70 border-rose-200/50"
                                }`}
                                style={{ animationDelay: `${(index + 1) * 100}ms` }}
                            >
                                <span
                                    className={`mt-1 inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ring-2 ${TYPE_COLORS[item.type]} flex-shrink-0`}
                                >
                                    {item.type === "reminder" && "⏰"}
                                    {item.type === "upload" && "📷"}
                                    {item.type === "partner" && "💬"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                        <h3 className="text-base font-bold text-rose-800 truncate">{item.title}</h3>
                                        <span className="text-xs text-rose-500/70 whitespace-nowrap font-medium">{item.timeAgo}</span>
                                    </div>
                                    <p className="text-sm text-rose-600/80 mt-1 leading-relaxed">{item.message}</p>
                                    {item.unread && (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-3">
                                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
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
