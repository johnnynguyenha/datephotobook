import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { notifyPartnerRemoved } from "@/lib/notifications";

export async function POST(req: Request) {
    const client = await pool.connect();

    try {
        const { user_id } = await req.json();

        if (!user_id) {
            client.release();
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        await client.query("BEGIN");


        const resUser = await client.query(
            "SELECT user_id, username, partner_id FROM users WHERE user_id = $1 FOR UPDATE",
            [user_id]
        );

        if (resUser.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = resUser.rows[0];

        if (!user.partner_id) {
            await client.query("ROLLBACK");
            client.release();
            return NextResponse.json(
                { error: "User does not currently have a partner" },
                { status: 400 }
            );
        }

        const partnerId = user.partner_id;


        const resPartner = await client.query(
            "SELECT user_id, partner_id FROM users WHERE user_id = $1 FOR UPDATE",
            [partnerId]
        );


        if (resPartner.rows.length > 0) {

            await client.query(
                "UPDATE users SET partner_id = NULL WHERE user_id = $1",
                [partnerId]
            );
        }


        await client.query(
            "UPDATE users SET partner_id = NULL WHERE user_id = $1",
            [user_id]
        );

        await client.query("COMMIT");
        client.release();

        // Notify the partner that the partnership has ended
        await notifyPartnerRemoved(partnerId, user.username);

        return NextResponse.json({ success: true });
    } catch (err) {
        await pool.query("ROLLBACK").catch(() => {});
        console.error("Error removing partner:", err);
        client.release();
        return NextResponse.json(
            { error: "Failed to remove partner" },
            { status: 500 }
        );
    }
}
