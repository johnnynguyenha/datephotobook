import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    try {
        const query = `
      SELECT 
        u.username AS user_name,
        p.username AS partner_name,
        pr.theme_setting,
        pr.display_name
      FROM users u
      LEFT JOIN users p ON u.partner_id = p.user_id
      LEFT JOIN profiles pr ON pr.user_id = u.user_id
      WHERE u.user_id = $1
      LIMIT 1;
    `;
        const { rows } = await pool.query(query, [userId]);

        if (!rows.length)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
