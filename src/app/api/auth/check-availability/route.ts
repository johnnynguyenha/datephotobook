import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { username, email } = await req.json();

        const errors: string[] = [];

        if (username) {
            const trimmedUsername = String(username).trim();
            if (trimmedUsername.length > 0) {
                const { rows } = await pool.query(
                    "SELECT 1 FROM users WHERE username = $1",
                    [trimmedUsername]
                );
                if (rows.length > 0) {
                    errors.push("Username already taken");
                }
            }
        }

        if (email) {
            const trimmedEmail = String(email).trim().toLowerCase();
            if (trimmedEmail.length > 0 && trimmedEmail.includes("@")) {
                const { rows } = await pool.query(
                    "SELECT 1 FROM users WHERE LOWER(email) = $1",
                    [trimmedEmail]
                );
                if (rows.length > 0) {
                    errors.push("Email already registered");
                }
            }
        }

        if (errors.length > 0) {
            return NextResponse.json(
                { available: false, errors },
                { status: 200 }
            );
        }

        return NextResponse.json({ available: true });
    } catch (err) {
        console.error("Error checking availability:", err);
        return NextResponse.json(
            { error: "Failed to check availability" },
            { status: 500 }
        );
    }
}

