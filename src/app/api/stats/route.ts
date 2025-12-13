import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

function isValidUUID(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = value.trim();
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v);
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let userId = searchParams.get("user_id");

        // Try to get user_id from auth cookie if not provided
        if (!userId) {
            const cookieStore = await cookies();
            const authCookie = cookieStore.get("auth");
            if (authCookie?.value) {
                try {
                    const auth = JSON.parse(authCookie.value);
                    userId = auth.user_id;
                } catch {
                    // Invalid cookie format
                }
            }
        }

        if (!userId || !isValidUUID(userId)) {
            // Return empty counts if no user
            return NextResponse.json({
                dates: 0,
                photos: 0,
                notifications: 0,
            });
        }

        // Get the user's partner_id
        const userResult = await pool.query(
            `SELECT partner_id FROM users WHERE user_id = $1`,
            [userId]
        );
        const partnerId = userResult.rows[0]?.partner_id;

        // Build queries for counts
        const queries: Promise<{ rows: { count: string }[] }>[] = [];

        // Dates count (user's dates + partner's dates if partnered)
        if (partnerId) {
            queries.push(
                pool.query(
                    `SELECT COUNT(*) as count FROM dates d
                     JOIN profiles p ON d.profile_id = p.profile_id
                     WHERE p.user_id = $1 OR p.user_id = $2`,
                    [userId, partnerId]
                )
            );
        } else {
            queries.push(
                pool.query(
                    `SELECT COUNT(*) as count FROM dates d
                     JOIN profiles p ON d.profile_id = p.profile_id
                     WHERE p.user_id = $1`,
                    [userId]
                )
            );
        }

        // Photos count
        if (partnerId) {
            queries.push(
                pool.query(
                    `SELECT COUNT(*) as count FROM photos WHERE user_id = $1 OR user_id = $2`,
                    [userId, partnerId]
                )
            );
        } else {
            queries.push(
                pool.query(
                    `SELECT COUNT(*) as count FROM photos WHERE user_id = $1`,
                    [userId]
                )
            );
        }

        // Unread notifications count
        queries.push(
            pool.query(
                `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_status = FALSE`,
                [userId]
            )
        );

        const [datesResult, photosResult, notificationsResult] = await Promise.all(queries);

        return NextResponse.json({
            dates: parseInt(datesResult.rows[0]?.count || "0", 10),
            photos: parseInt(photosResult.rows[0]?.count || "0", 10),
            notifications: parseInt(notificationsResult.rows[0]?.count || "0", 10),
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        return NextResponse.json({
            dates: 0,
            photos: 0,
            notifications: 0,
        });
    }
}
