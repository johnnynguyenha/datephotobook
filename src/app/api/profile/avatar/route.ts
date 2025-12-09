import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

function isValidUUID(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = value.trim();
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v);
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Use multipart/form-data for avatar upload" },
                { status: 415 }
            );
        }

        const formData = await req.formData();

        const userIdRaw = formData.get("user_id");
        const userId =
            (typeof userIdRaw === "string" ? userIdRaw : String(userIdRaw || ""))
                .trim() || null;

        if (!userId || !isValidUUID(userId)) {
            return NextResponse.json(
                { error: "Valid user_id is required" },
                { status: 400 }
            );
        }

        const file = formData.get("avatar");
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json(
                { error: "avatar file is required" },
                { status: 400 }
            );
        }

        const imagesDir = path.join(process.cwd(), "public", "images");
        await fs.mkdir(imagesDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `profile-${userId}.jpg`;
        const filePath = path.join(imagesDir, fileName);

        await fs.writeFile(filePath, buffer);

        const relativePath = `/images/${fileName}`;

        return NextResponse.json({ image_path: relativePath }, { status: 200 });
    } catch (err) {
        console.error("Error uploading profile avatar:", err);
        return NextResponse.json(
            { error: "Failed to upload profile picture" },
            { status: 500 }
        );
    }
}
