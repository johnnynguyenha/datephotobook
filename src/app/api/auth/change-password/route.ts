import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { user_id, oldPassword, newPassword } = await req.json();

        if (!user_id || !oldPassword || !newPassword) {
            return NextResponse.json(
                { error: "user_id, old password and new password are required." },
                { status: 400 }
            );
        }

        const userRes = await pool.query(
            `SELECT user_id, password_hashed FROM users WHERE user_id = $1`,
            [user_id]
        );

        if (userRes.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found." },
                { status: 404 }
            );
        }

        const user = userRes.rows[0];

        const valid = await bcrypt.compare(
            String(oldPassword),
            String(user.password_hashed)
        );

        if (!valid) {
            return NextResponse.json(
                { error: "Current password is incorrect." },
                { status: 401 }
            );
        }

        const hashed = await bcrypt.hash(String(newPassword), 10);

        await pool.query(
            `UPDATE users SET password_hashed = $1 WHERE user_id = $2`,
            [hashed, user_id]
        );

        return NextResponse.json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (err) {
        console.error("Error in /api/auth/change-password:", err);
        return NextResponse.json(
            { error: "Failed to change password." },
            { status: 500 }
        );
    }
}
