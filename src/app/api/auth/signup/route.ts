import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { username, email, password, partnerUsername } = await req.json();

        const { rows: existing } = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (existing.length > 0) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        let partner_id: string | null = null;
        if (partnerUsername) {
            const { rows: partner } = await pool.query(
                "SELECT user_id FROM users WHERE username = $1",
                [partnerUsername]
            );
            if (partner.length === 0) {
                return NextResponse.json({ error: "Partner username not found" }, { status: 400 });
            }
            partner_id = partner[0].user_id;
        }

        const password_hashed = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `INSERT INTO users (user_id, username, email, password_hashed, partner_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING user_id, username, email, partner_id`,
            [username, email, password_hashed, partner_id]
        );

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }
}
