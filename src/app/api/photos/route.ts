import { NextResponse } from "next/server";
import pool from "@/lib/db";

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
        const userId = searchParams.get("user_id");

        if (!userId || !isValidUUID(userId)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        // fetch all photos for the user and date info
        const result = await pool.query(
            `
                SELECT 
                    ph.photo_id,
                    ph.date_id,
                    ph.user_id,
                    ph.file_path,
                    ph.description,
                    ph.uploaded_at,
                    d.title as date_title,
                    d.date_time,
                    d.location as date_location
                FROM photos ph
                JOIN dates d ON ph.date_id = d.date_id
                WHERE ph.user_id = $1
                ORDER BY ph.uploaded_at DESC
            `,
            [userId]
        );

        return NextResponse.json(result.rows);
    } catch (err) {
        console.error("Error fetching photos:", err);
        return NextResponse.json(
            { error: "Failed to fetch photos" },
            { status: 500 }
        );
    }
}
