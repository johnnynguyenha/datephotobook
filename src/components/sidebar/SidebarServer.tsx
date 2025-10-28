import SidebarClient, { NavCounts } from "./SidebarClient";

async function getCounts(): Promise<NavCounts | undefined> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/stats`, {
            next: { revalidate: 30 },
        });
        if (!res.ok) return undefined;
        return (await res.json()) as NavCounts;
    } catch {
        return undefined;
    }
}

export default async function SidebarServer() {
    const counts = await getCounts();
    return <SidebarClient counts={counts} />;
}
