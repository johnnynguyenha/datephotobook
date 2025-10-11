import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    const { rows } = await pool.query("SELECT * FROM dates ORDER BY date_time DESC");
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const { title, description, date_time, location, privacy, profile_id, image } = await req.json();
    const { rows } = await pool.query(
        `INSERT INTO dates (date_id, profile_id, title, description, date_time, location, privacy, image)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [profile_id, title, description, date_time, location, privacy, image]
    );
    return NextResponse.json(rows[0]);
}
