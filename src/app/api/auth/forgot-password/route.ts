import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json(
                { error: "Email and new password are required." },
                { status: 400 }
            );
        }

        const trimmedEmail = String(email).trim().toLowerCase();

        const userRes = await pool.query(
            `SELECT user_id, email, username FROM users WHERE LOWER(email) = $1`,
            [trimmedEmail]
        );

        if (userRes.rows.length === 0) {
            return NextResponse.json(
                { error: "Incorrect Email" },
                { status: 404 }
            );
        }

        const user = userRes.rows[0];

        const hashed = await bcrypt.hash(String(newPassword), 10);

        await pool.query(
            `UPDATE users SET password_hashed = $1 WHERE user_id = $2`,
            [hashed, user.user_id]
        );

        return NextResponse.json({
            success: true,
            user_id: user.user_id,
            email: user.email,
            username: user.username,
        });
    } catch (err) {
        console.error("Error in /api/auth/forgot-password:", err);
        return NextResponse.json(
            { error: "Failed to reset password." },
            { status: 500 }
        );
    }
}
