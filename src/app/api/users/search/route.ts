import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json([], { status: 200 });
    }

    try {
        const { rows } = await pool.query(
            "SELECT user_id, username FROM users WHERE username ILIKE $1 ORDER BY username LIMIT 10",
            [`%${query}%`]
        );
        return NextResponse.json(rows);
    } catch (err) {
        console.error("Error searching users:", err);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
