import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { from_user_id, to_username } = await req.json();

        if (!from_user_id || !to_username) {
            return NextResponse.json(
                { error: "from_user_id and to_username are required" },
                { status: 400 }
            );
        }

        if (typeof from_user_id !== "string" || typeof to_username !== "string") {
            return NextResponse.json(
                { error: "Invalid payload" },
                { status: 400 }
            );
        }

        const { rows: senderRows } = await pool.query(
            "SELECT user_id, username, partner_id FROM users WHERE user_id = $1",
            [from_user_id]
        );
        if (senderRows.length === 0) {
            return NextResponse.json({ error: "Sender not found" }, { status: 404 });
        }
        const sender = senderRows[0];

        const { rows: receiverRows } = await pool.query(
            "SELECT user_id, username, partner_id FROM users WHERE username = $1",
            [to_username]
        );
        if (receiverRows.length === 0) {
            return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
        }
        const receiver = receiverRows[0];

        if (sender.user_id === receiver.user_id) {
            return NextResponse.json(
                { error: "You cannot partner with yourself" },
                { status: 400 }
            );
        }


        if (sender.partner_id) {
            return NextResponse.json(
                { error: "You already have a partner" },
                { status: 400 }
            );
        }
        if (receiver.partner_id) {
            return NextResponse.json(
                { error: "The requested user already has a partner" },
                { status: 400 }
            );
        }


        const { rows: existingReqs } = await pool.query(
            `
      SELECT notification_id
      FROM notifications
      WHERE type = 'PARTNER_REQUEST'
        AND read_status = FALSE
        AND (
            (user_id = $1 AND message LIKE $2)
         OR (user_id = $3 AND message LIKE $4)
        )
      `,
            [
                receiver.user_id,
                `%${sender.user_id}%`,
                sender.user_id,
                `%${receiver.user_id}%`,
            ]
        );

        if (existingReqs.length > 0) {
            return NextResponse.json(
                { error: "There is already a pending partner request between you" },
                { status: 400 }
            );
        }


        const message = JSON.stringify({
            from_user_id: sender.user_id,
            from_username: sender.username,
            to_user_id: receiver.user_id,
            to_username: receiver.username,
        });

        const { rows: notifRows } = await pool.query(
            `
      INSERT INTO notifications (user_id, type, message)
      VALUES ($1, 'PARTNER_REQUEST', $2)
      RETURNING notification_id
      `,
            [receiver.user_id, message]
        );

        return NextResponse.json({
            success: true,
            notification_id: notifRows[0].notification_id,
        });
    } catch (err) {
        console.error("Error sending partner request:", err);
        return NextResponse.json(
            { error: "Failed to send partner request" },
            { status: 500 }
        );
    }
}
