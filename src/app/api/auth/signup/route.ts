import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();

        const { rows: existing } = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (existing.length > 0) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        const password_hashed = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `INSERT INTO users (user_id, username, email, password_hashed, partner_id)
       VALUES (gen_random_uuid(), $1, $2, $3, NULL)
       RETURNING user_id, username, email`,
            [username, email, password_hashed]
        );

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }
}
