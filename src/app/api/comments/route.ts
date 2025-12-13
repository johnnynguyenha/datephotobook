import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { notifyComment } from "@/lib/notifications";

type CommentRow = {
    comment_id: string;
    content: string;
    created_at: string;
    user_id: string;
    username: string;
};

async function getDateVisibility(dateId: string) {
    const { rows } = await pool.query(
        `
    SELECT
      d.date_id,
      d.title AS date_title,
      d.privacy AS date_privacy,
      p.visibility AS profile_visibility,
      p.user_id AS owner_user_id,
      u.partner_id AS owner_partner_id
    FROM dates d
    JOIN profiles p ON d.profile_id = p.profile_id
    JOIN users u ON p.user_id = u.user_id
    WHERE d.date_id = $1
    `,
        [dateId]
    );

    return rows[0] as {
        date_id: string;
        date_title: string | null;
        date_privacy: "INHERIT" | "PUBLIC" | "PRIVATE";
        profile_visibility: "PUBLIC" | "PRIVATE";
        owner_user_id: string;
        owner_partner_id: string | null;
    } | undefined;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateId = searchParams.get("dateId");

        if (!dateId) {
            return NextResponse.json(
                { error: "dateId query param is required" },
                { status: 400 }
            );
        }

        const { rows } = await pool.query<CommentRow>(
            `
      SELECT
        c.comment_id,
        c.content,
        c.created_at,
        u.user_id,
        u.username
      FROM comments c
      JOIN users u ON u.user_id = c.user_id
      WHERE c.date_id = $1
      ORDER BY c.created_at ASC
      `,
            [dateId]
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (err) {
        console.error("GET /api/comments error", err);
        return NextResponse.json(
            { error: "Failed to load comments" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dateId, content, userId } = body as {
            dateId?: string;
            content?: string;
            userId?: string;
        };

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!dateId || !content?.trim()) {
            return NextResponse.json(
                { error: "dateId and non-empty content required" },
                { status: 400 }
            );
        }

        const dateInfo = await getDateVisibility(dateId);
        if (!dateInfo) {
            return NextResponse.json(
                { error: "Date not found" },
                { status: 404 }
            );
        }

        const {
            date_privacy,
            profile_visibility,
            owner_user_id,
            owner_partner_id,
        } = dateInfo;

        const isPublic =
            date_privacy === "PUBLIC" ||
            (date_privacy === "INHERIT" && profile_visibility === "PUBLIC");

        const isPrivate =
            date_privacy === "PRIVATE" ||
            (date_privacy === "INHERIT" && profile_visibility === "PRIVATE");

        let allowed = false;

        if (isPublic) {
            allowed = true;
        } else if (isPrivate) {
            if (userId === owner_user_id) {
                allowed = true;
            } else if (owner_partner_id && userId === owner_partner_id) {
                allowed = true;
            }
        }

        if (!allowed) {
            return NextResponse.json(
                { error: "You are not allowed to comment on this date" },
                { status: 403 }
            );
        }

        const { rows } = await pool.query(
            `
      INSERT INTO comments (date_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING comment_id, content, created_at
      `,
            [dateId, userId, content.trim()]
        );

        const inserted = rows[0];

        const userRes = await pool.query(
            `SELECT username FROM users WHERE user_id = $1`,
            [userId]
        );
        const username = userRes.rows[0]?.username ?? "Unknown";

        // Send notification to date owner (if not the commenter)
        if (userId !== owner_user_id) {
            const dateTitle = dateInfo.date_title || "your date";
            notifyComment(
                owner_user_id,
                userId,
                username,
                dateId,
                dateTitle,
                content.trim().slice(0, 100)
            ).catch((err) => console.error("Failed to send comment notification:", err));
        }

        // Also notify partner if they exist and are not the commenter
        if (owner_partner_id && userId !== owner_partner_id) {
            const dateTitle = dateInfo.date_title || "a date";
            notifyComment(
                owner_partner_id,
                userId,
                username,
                dateId,
                dateTitle,
                content.trim().slice(0, 100)
            ).catch((err) => console.error("Failed to send comment notification to partner:", err));
        }

        return NextResponse.json(
            {
                comment_id: inserted.comment_id,
                content: inserted.content,
                created_at: inserted.created_at,
                user_id: userId,
                username,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/comments error", err);
        return NextResponse.json(
            { error: "Failed to post comment" },
            { status: 500 }
        );
    }
}
