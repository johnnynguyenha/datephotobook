import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
    const client = await pool.connect();

    try {
        const { user_id, notification_id } = await req.json();

        if (!user_id || !notification_id) {
            client.release();
            return NextResponse.json(
                { error: "user_id and notification_id are required" },
                { status: 400 }
            );
        }

        await client.query("BEGIN");

        const notifRes = await client.query(
            `
      SELECT notification_id, user_id, message, read_status
      FROM notifications
      WHERE notification_id = $1
        AND type = 'PARTNER_REQUEST'
      FOR UPDATE
      `,
            [notification_id]
        );

        if (notifRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json(
                { error: "Partner request not found" },
                { status: 404 }
            );
        }

        const notif = notifRes.rows[0];

        if (notif.user_id !== user_id) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json(
                { error: "This request does not belong to this user" },
                { status: 403 }
            );
        }

        if (notif.read_status) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json(
                { error: "This request has already been processed" },
                { status: 400 }
            );
        }

        const payload = JSON.parse(notif.message);
        const fromUserId = payload.from_user_id as string;
        const toUserId = payload.to_user_id as string;

        const usersRes = await client.query(
            `
      SELECT user_id, partner_id
      FROM users
      WHERE user_id = ANY($1::uuid[])
      FOR UPDATE
      `,
            [[fromUserId, toUserId]]
        );

        if (usersRes.rows.length !== 2) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json(
                { error: "One or both users not found" },
                { status: 404 }
            );
        }

        const sender = usersRes.rows.find((u) => u.user_id === fromUserId)!;
        const receiver = usersRes.rows.find((u) => u.user_id === toUserId)!;

        if (sender.partner_id || receiver.partner_id) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json(
                { error: "One of the users already has a partner" },
                { status: 400 }
            );
        }

        await client.query(
            "UPDATE users SET partner_id = $1 WHERE user_id = $2",
            [receiver.user_id, sender.user_id]
        );
        await client.query(
            "UPDATE users SET partner_id = $1 WHERE user_id = $2",
            [sender.user_id, receiver.user_id]
        );

        await client.query(
            `
      UPDATE notifications
      SET read_status = TRUE
      WHERE notification_id = $1
      `,
            [notification_id]
        );

        await client.query("COMMIT");
        client.release();

        return NextResponse.json({ success: true });
    } catch (err) {
        await pool.query("ROLLBACK").catch(() => {});
        console.error("Error accepting partner request:", err);
        client.release();
        return NextResponse.json(
            { error: "Failed to accept partner request" },
            { status: 500 }
        );
    }
}
