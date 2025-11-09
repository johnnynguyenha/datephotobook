import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user_id");

        if (!userId) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(
            `
      SELECT notification_id, message, created_at
      FROM notifications
      WHERE user_id = $1
        AND type = 'PARTNER_REQUEST'
        AND read_status = FALSE
      ORDER BY created_at DESC
      `,
            [userId]
        );

        // Parse JSON message field
        const requests = rows.map((r) => ({
            notification_id: r.notification_id,
            created_at: r.created_at,
            ...(JSON.parse(r.message) as any),
        }));

        return NextResponse.json(requests);
    } catch (err) {
        console.error("Error fetching partner requests:", err);
        return NextResponse.json(
            { error: "Failed to fetch partner requests" },
            { status: 500 }
        );
    }
}
