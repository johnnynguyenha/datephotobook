import { NextResponse } from "next/server";
import pool from "@/lib/db";

function isValidUUID(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = value.trim();
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v);
}

// Ensure the notifications_enabled column exists
async function ensureColumnExists(): Promise<boolean> {
    try {
        // Check if column exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
        `);

        if (checkResult.rows.length === 0) {
            // Column doesn't exist, add it
            await pool.query(`
                ALTER TABLE profiles 
                ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE
            `);
        }
        return true;
    } catch (err) {
        console.error("Error ensuring notifications_enabled column:", err);
        return false;
    }
}

// GET - Fetch notification settings for a user
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

        // Ensure column exists
        await ensureColumnExists();

        // Check if user has notification settings in profiles table
        const { rows } = await pool.query(
            `SELECT profile_id, notifications_enabled FROM profiles WHERE user_id = $1 LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) {
            // Return default settings if no profile exists
            return NextResponse.json({
                notifications_enabled: true,
                partner_updates: true,
                date_reminders: true,
                photo_uploads: true,
            });
        }

        // Return settings - notifications_enabled might not exist, default to true
        const notificationsEnabled = rows[0].notifications_enabled ?? true;

        return NextResponse.json({
            notifications_enabled: notificationsEnabled,
            partner_updates: notificationsEnabled,
            date_reminders: notificationsEnabled,
            photo_uploads: notificationsEnabled,
        });
    } catch (err) {
        console.error("Error fetching notification settings:", err);
        return NextResponse.json(
            { error: "Failed to fetch notification settings" },
            { status: 500 }
        );
    }
}

// PATCH - Update notification settings for a user
export async function PATCH(req: Request) {
    try {
        const { user_id, notifications_enabled } = await req.json();

        if (!user_id || !isValidUUID(user_id)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        // Ensure column exists first
        const columnExists = await ensureColumnExists();
        if (!columnExists) {
            return NextResponse.json(
                { error: "Failed to initialize notification settings" },
                { status: 500 }
            );
        }

        // Check if profile exists
        const { rows: existingProfile } = await pool.query(
            `SELECT profile_id FROM profiles WHERE user_id = $1 LIMIT 1`,
            [user_id]
        );

        const newValue = notifications_enabled !== false;

        if (existingProfile.length === 0) {
            // Create profile with notification settings
            await pool.query(
                `INSERT INTO profiles (user_id, display_name, theme_setting, visibility, layout_type, notifications_enabled)
                 VALUES ($1, 'My Profile', 'default', 'PRIVATE', 'GALLERY', $2)`,
                [user_id, newValue]
            );
        } else {
            // Update existing profile
            await pool.query(
                `UPDATE profiles SET notifications_enabled = $1 WHERE user_id = $2`,
                [newValue, user_id]
            );
        }

        return NextResponse.json({
            success: true,
            notifications_enabled: newValue,
        });
    } catch (err) {
        console.error("Error updating notification settings:", err);
        return NextResponse.json(
            { error: "Failed to update notification settings" },
            { status: 500 }
        );
    }
}
