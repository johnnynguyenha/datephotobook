import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { username, email, password, partnerUsername } = await req.json();

        const { rows: existing } = await pool.query(
            "SELECT 1 FROM users WHERE email = $1",
            [email]
        );
        if (existing.length > 0) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        let partner_id: string | null = null;
        let note: string | undefined;

        if (typeof partnerUsername === "string" && partnerUsername.trim().length > 0) {
            const { rows: partner } = await pool.query(
                "SELECT user_id FROM users WHERE username = $1",
                [partnerUsername.trim()]
            );

            if (partner.length > 0) {
                partner_id = partner[0].user_id;
            } else {
                note = "Partner not found. You can link them later from your profile.";
            }
        }

        const password_hashed = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `INSERT INTO users (user_id, username, email, password_hashed, partner_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
                 RETURNING user_id, username, email, partner_id`,
            [username, email, password_hashed, partner_id]
        );

        return NextResponse.json({ ...rows[0], note });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }
}
