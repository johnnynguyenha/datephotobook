import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const username = searchParams.get("username");

    if (!userId && !username) {
        return NextResponse.json({ error: "Missing user_id or username" }, { status: 400 });
    }

    try {
        let query: string;
        let params: string[];

        if (username) {
            query = `
                SELECT 
                    u.user_id,
                    u.username AS user_name,
                    u.partner_id,
                    p.username AS partner_name,
                    pr.theme_setting,
                    pr.display_name
                FROM users u
                LEFT JOIN users p ON u.partner_id = p.user_id
                LEFT JOIN profiles pr ON pr.user_id = u.user_id
                WHERE u.username = $1
                LIMIT 1;
            `;
            params = [username];
        } else {
            query = `
                SELECT 
                    u.user_id,
                    u.username AS user_name,
                    u.email,
                    u.partner_id,
                    p.username AS partner_name,
                    pr.theme_setting,
                    pr.display_name
                FROM users u
                LEFT JOIN users p ON u.partner_id = p.user_id
                LEFT JOIN profiles pr ON pr.user_id = u.user_id
                WHERE u.user_id = $1
                LIMIT 1;
            `;
            params = [userId!];
        }

        const { rows } = await pool.query(query, params);

        if (!rows.length)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
