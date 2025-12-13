import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { username, email, password, partnerUsername } = await req.json();

        // check if we have all the required fields
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Username, email, and password are required" },
                { status: 400 }
            );
        }

        // clean up the input
        const trimmedUsername = String(username).trim();
        const trimmedEmail = String(email).trim().toLowerCase();

        if (trimmedUsername.length === 0) {
            return NextResponse.json({ error: "Username cannot be empty" }, { status: 400 });
        }

        if (trimmedEmail.length === 0 || !trimmedEmail.includes("@")) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // make sure email isn't already taken
        const { rows: existingEmail } = await pool.query(
            "SELECT 1 FROM users WHERE LOWER(email) = $1",
            [trimmedEmail]
        );
        if (existingEmail.length > 0) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        // make sure username isn't already taken
        const { rows: existingUsername } = await pool.query(
            "SELECT 1 FROM users WHERE username = $1",
            [trimmedUsername]
        );
        if (existingUsername.length > 0) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
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

        const password_hashed = await bcrypt.hash(String(password), 10);

        // create the user account
        const { rows } = await pool.query(
            `INSERT INTO users (user_id, username, email, password_hashed, partner_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
                 RETURNING user_id, username, email, partner_id`,
            [trimmedUsername, trimmedEmail, password_hashed, partner_id]
        );

        const newUser = rows[0];

        // set up a default profile for them
        try {
            await pool.query(
                `INSERT INTO profiles (user_id, display_name, theme_setting, visibility, layout_type)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (user_id) DO NOTHING`,
                [newUser.user_id, "My Profile", "default", "PRIVATE", "GALLERY"]
            );
        } catch (profileErr) {
            // profile creation failed but that's okay, they can still use the site
            console.warn("Failed to create profile on signup:", profileErr);
        }

        return NextResponse.json({ ...newUser, note });
    } catch (err: any) {
        console.error("Signup error:", err);
        
        // handle duplicate username/email errors
        if (err.code === "23505") { // unique violation
            if (err.constraint?.includes("username")) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 });
            }
            if (err.constraint?.includes("email")) {
                return NextResponse.json({ error: "Email already registered" }, { status: 400 });
            }
        }

        return NextResponse.json(
            { error: err.message || "Signup failed. Please try again." },
            { status: 500 }
        );
    }
}
