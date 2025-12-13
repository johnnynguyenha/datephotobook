import { NextResponse } from "next/server";
import pool from "@/lib/db";

function isValidUUID(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = value.trim();
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v);
}

// GET - Fetch all notifications for a user
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user_id");
        const unreadOnly = searchParams.get("unread_only") === "true";

        if (!userId || !isValidUUID(userId)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        let query = `
            SELECT 
                n.notification_id,
                n.user_id,
                n.type,
                n.message,
                n.read_status,
                n.created_at
            FROM notifications n
            WHERE n.user_id = $1
        `;

        if (unreadOnly) {
            query += ` AND n.read_status = FALSE`;
        }

        query += ` ORDER BY n.created_at DESC LIMIT 50`;

        const { rows } = await pool.query(query, [userId]);

        // Parse message JSON and format the notifications
        const notifications = rows.map((row) => {
            let parsedMessage: Record<string, unknown> = {};
            try {
                parsedMessage = JSON.parse(row.message);
            } catch {
                parsedMessage = { text: row.message };
            }

            return {
                id: row.notification_id,
                type: row.type,
                message: parsedMessage,
                read: row.read_status,
                createdAt: row.created_at,
            };
        });

        // Also get the unread count
        const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_status = FALSE`,
            [userId]
        );
        const unreadCount = parseInt(countResult.rows[0].count, 10);

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST - Create a new notification
export async function POST(req: Request) {
    try {
        const { user_id, type, message } = await req.json();

        if (!user_id || !isValidUUID(user_id)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        if (!type) {
            return NextResponse.json(
                { error: "type is required" },
                { status: 400 }
            );
        }

        const messageStr = typeof message === "string" ? message : JSON.stringify(message);

        const { rows } = await pool.query(
            `
            INSERT INTO notifications (user_id, type, message)
            VALUES ($1, $2, $3)
            RETURNING notification_id, user_id, type, message, read_status, created_at
            `,
            [user_id, type, messageStr]
        );

        return NextResponse.json({
            success: true,
            notification: {
                id: rows[0].notification_id,
                type: rows[0].type,
                message: typeof message === "string" ? { text: message } : message,
                read: rows[0].read_status,
                createdAt: rows[0].created_at,
            },
        });
    } catch (err) {
        console.error("Error creating notification:", err);
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        );
    }
}

// PATCH - Mark notification(s) as read
export async function PATCH(req: Request) {
    try {
        const { user_id, notification_id, mark_all } = await req.json();

        if (!user_id || !isValidUUID(user_id)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        if (mark_all) {
            // Mark all notifications as read for this user
            await pool.query(
                `UPDATE notifications SET read_status = TRUE WHERE user_id = $1 AND read_status = FALSE`,
                [user_id]
            );
            return NextResponse.json({ success: true, message: "All notifications marked as read" });
        }

        if (!notification_id || !isValidUUID(notification_id)) {
            return NextResponse.json(
                { error: "Valid notification_id is required" },
                { status: 400 }
            );
        }

        // Verify the notification belongs to this user
        const { rows } = await pool.query(
            `SELECT notification_id FROM notifications WHERE notification_id = $1 AND user_id = $2`,
            [notification_id, user_id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Notification not found or access denied" },
                { status: 404 }
            );
        }

        await pool.query(
            `UPDATE notifications SET read_status = TRUE WHERE notification_id = $1`,
            [notification_id]
        );

        return NextResponse.json({ success: true, message: "Notification marked as read" });
    } catch (err) {
        console.error("Error updating notification:", err);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a notification
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user_id");
        const notificationId = searchParams.get("notification_id");

        if (!userId || !isValidUUID(userId)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        if (!notificationId || !isValidUUID(notificationId)) {
            return NextResponse.json(
                { error: "Valid notification_id is required" },
                { status: 400 }
            );
        }

        // Verify the notification belongs to this user
        const { rows } = await pool.query(
            `SELECT notification_id FROM notifications WHERE notification_id = $1 AND user_id = $2`,
            [notificationId, userId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Notification not found or access denied" },
                { status: 404 }
            );
        }

        await pool.query(
            `DELETE FROM notifications WHERE notification_id = $1`,
            [notificationId]
        );

        return NextResponse.json({ success: true, message: "Notification deleted" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        return NextResponse.json(
            { error: "Failed to delete notification" },
            { status: 500 }
        );
    }
}
