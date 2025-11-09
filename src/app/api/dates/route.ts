import { NextResponse } from "next/server";
import pool from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";

function isValidUUID(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = value.trim();
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v);
}

async function getOrCreateProfileIdForUser(user_id: string): Promise<string> {
    const existing = await pool.query(
        `SELECT profile_id FROM profiles WHERE user_id = $1 LIMIT 1`,
        [user_id]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0].profile_id as string;
    }

    const created = await pool.query(
        `
            INSERT INTO profiles (user_id, display_name, theme_setting, visibility, layout_type)
            VALUES ($1, $2, $3, $4, $5)
                RETURNING profile_id
        `,
        [user_id, "My Profile", "default", "PRIVATE", "GALLERY"]
    );

    return created.rows[0].profile_id as string;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user_id");

        let rows;


        if (userId && isValidUUID(userId)) {
            const result = await pool.query(
                `
                    SELECT d.*, p.user_id, p.visibility, ph.file_path AS image_path
                    FROM dates d
                             JOIN profiles p ON d.profile_id = p.profile_id
                             LEFT JOIN LATERAL (
                        SELECT file_path FROM photos WHERE date_id = d.date_id ORDER BY uploaded_at ASC LIMIT 1
    ) ph ON true
                    WHERE
                        p.user_id = $1
                       OR d.privacy = 'PUBLIC'
                       OR (d.privacy = 'INHERIT' AND p.visibility = 'PUBLIC')
                    ORDER BY d.date_time DESC
                `,
                [userId]
            );
            rows = result.rows;
        } else {
            const result = await pool.query(
                `
                    SELECT d.*, p.user_id, p.visibility, ph.file_path AS image_path
                    FROM dates d
                             JOIN profiles p ON d.profile_id = p.profile_id
                             LEFT JOIN LATERAL (
                        SELECT file_path FROM photos WHERE date_id = d.date_id ORDER BY uploaded_at ASC LIMIT 1
    ) ph ON true
                    WHERE
                        d.privacy = 'PUBLIC'
                       OR (d.privacy = 'INHERIT' AND p.visibility = 'PUBLIC')
                    ORDER BY d.date_time DESC
                `
            );
            rows = result.rows;
        }

        return NextResponse.json(rows);
    } catch (err) {
        console.error("Error fetching dates:", err);
        return NextResponse.json(
            { error: "Failed to fetch dates" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";

        let title: string | null = null;
        let description: string | null = null;
        let date_time: string | null = null;
        let location: string | null = null;
        let privacy: string | null = null;
        let user_id: string | null = null;

        let imageFile: File | null = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();

            title = (formData.get("title") as string) ?? null;
            description = (formData.get("description") as string) ?? null;
            date_time = (formData.get("date_time") as string) ?? null;
            location = (formData.get("location") as string) ?? null;
            privacy = (formData.get("privacy") as string) ?? null;
            user_id = (formData.get("user_id") as string) ?? null;

            const maybeFile = formData.get("image");
            if (maybeFile instanceof File && maybeFile.size > 0) {
                imageFile = maybeFile;
            }
        }
        else if (contentType.includes("application/json")) {
            const data = await req.json();

            title = data.title ?? null;
            description = data.description ?? null;
            date_time = data.date_time ?? null;
            location = data.location ?? null;
            privacy = data.privacy ?? null;
            user_id = data.user_id ?? null;
        }

        else {
            return NextResponse.json(
                {
                    error:
                        "Unsupported Content-Type. Use multipart/form-data or application/json.",
                },
                { status: 415 }
            );
        }

        user_id = user_id?.toString().trim() || null;
        if (user_id === "undefined" || user_id === "null" || user_id === "") {
            user_id = null;
        }
        privacy = privacy?.toString().trim() || "INHERIT";

        console.log("Incoming /api/dates payload:", {
            contentType,
            title,
            description,
            date_time,
            location,
            privacy,
            user_id,
            hasImageFile: !!imageFile,
        });

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id (logged-in user) is required" },
                { status: 400 }
            );
        }
        if (!isValidUUID(user_id)) {
            return NextResponse.json(
                { error: `user_id is not a valid UUID: ${user_id}` },
                { status: 400 }
            );
        }

        if (!date_time) {
            return NextResponse.json(
                { error: "date_time is required" },
                { status: 400 }
            );
        }

        const profile_id = await getOrCreateProfileIdForUser(user_id);


        const dateResult = await pool.query(
            `
                INSERT INTO dates (profile_id, title, description, date_time, location, privacy)
                VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
            `,
            [profile_id, title, description, date_time, location, privacy]
        );

        const dateRow = dateResult.rows[0];
        const date_id: string = dateRow.date_id;

        let photoRow: any = null;

        if (imageFile) {
            const imagesDir = path.join(process.cwd(), "public", "images");
            await fs.mkdir(imagesDir, { recursive: true });

            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const safeName = imageFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const fileName = `${date_id}-${Date.now()}-${safeName}`;
            const filePath = path.join(imagesDir, fileName);

            await fs.writeFile(filePath, buffer);

            const relativePath = `/images/${fileName}`;

            const photoResult = await pool.query(
                `
                    INSERT INTO photos (date_id, user_id, file_path, description)
                    VALUES ($1, $2, $3, $4)
                        RETURNING *
                `,
                [date_id, user_id, relativePath, description]
            );

            photoRow = photoResult.rows[0];
        }

        return NextResponse.json({ date: dateRow, photo: photoRow });
    } catch (err) {
        console.error("Error creating date:", err);
        return NextResponse.json(
            { error: "Failed to create date" },
            { status: 500 }
        );
    }
}
