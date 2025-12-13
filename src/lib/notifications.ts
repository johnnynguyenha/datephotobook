/**
 * Notification Helper Functions
 * 
 * Use these server-side functions to create notifications when specific events occur.
 * Import and call these from your API routes.
 */

import pool from "@/lib/db";

export type NotificationType = 
    | "PARTNER_REQUEST"
    | "PARTNER_ACCEPTED"
    | "PARTNER_REMOVED"
    | "DATE_REMINDER"
    | "DATE_UPCOMING"
    | "PHOTO_UPLOAD"
    | "COMMENT"
    | "GENERAL";

type NotificationPayload = {
    user_id: string;
    type: NotificationType;
    message: Record<string, unknown>;
};

/**
 * Check if a user has notifications enabled
 */
export async function areNotificationsEnabled(userId: string): Promise<boolean> {
    try {
        const { rows } = await pool.query(
            `SELECT notifications_enabled FROM profiles WHERE user_id = $1 LIMIT 1`,
            [userId]
        );

        // Default to true if no setting exists or no profile
        if (rows.length === 0) return true;
        return rows[0].notifications_enabled ?? true;
    } catch {
        return true; // Default to enabled if check fails
    }
}

/**
 * Create a notification for a user (internal use - does not check settings)
 */
async function createNotificationDirect(payload: NotificationPayload): Promise<string | null> {
    try {
        const { user_id, type, message } = payload;
        const messageStr = JSON.stringify(message);

        const { rows } = await pool.query(
            `INSERT INTO notifications (user_id, type, message)
             VALUES ($1, $2, $3)
             RETURNING notification_id`,
            [user_id, type, messageStr]
        );

        return rows[0]?.notification_id || null;
    } catch (err) {
        console.error("Error creating notification:", err);
        return null;
    }
}

/**
 * Create a notification for a user - checks if notifications are enabled first
 */
export async function createNotification(payload: NotificationPayload): Promise<string | null> {
    // Check if user has notifications enabled
    const enabled = await areNotificationsEnabled(payload.user_id);
    if (!enabled) {
        return null;
    }
    return createNotificationDirect(payload);
}

/**
 * Send notification when a partner accepts the request
 */
export async function notifyPartnerAccepted(
    requesterId: string,
    accepterId: string,
    accepterUsername: string
): Promise<void> {
    await createNotification({
        user_id: requesterId,
        type: "PARTNER_ACCEPTED",
        message: {
            from_user_id: accepterId,
            from_username: accepterUsername,
            text: `${accepterUsername} accepted your partner request!`,
        },
    });
}

/**
 * Send notification when a partner is removed
 */
export async function notifyPartnerRemoved(
    partnerId: string,
    removedByUsername: string
): Promise<void> {
    await createNotification({
        user_id: partnerId,
        type: "PARTNER_REMOVED",
        message: {
            from_username: removedByUsername,
            text: `${removedByUsername} ended the partnership.`,
        },
    });
}

/**
 * Send notification about a date reminder
 */
export async function notifyDateReminder(
    userId: string,
    dateId: string,
    dateTitle: string,
    reminderText?: string
): Promise<void> {
    await createNotification({
        user_id: userId,
        type: "DATE_REMINDER",
        message: {
            date_id: dateId,
            date_title: dateTitle,
            text: reminderText || `Don't forget about "${dateTitle}"!`,
        },
    });
}

/**
 * Send notification about an upcoming date
 */
export async function notifyDateUpcoming(
    userId: string,
    dateId: string,
    dateTitle: string,
    dateTime: Date
): Promise<void> {
    const timeStr = dateTime.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    await createNotification({
        user_id: userId,
        type: "DATE_UPCOMING",
        message: {
            date_id: dateId,
            date_title: dateTitle,
            text: `"${dateTitle}" is coming up on ${timeStr}!`,
        },
    });
}

/**
 * Send notification when photos are uploaded
 */
export async function notifyPhotoUpload(
    partnerId: string,
    uploaderId: string,
    uploaderUsername: string,
    dateId: string,
    dateTitle: string,
    photoCount: number
): Promise<void> {
    await createNotification({
        user_id: partnerId,
        type: "PHOTO_UPLOAD",
        message: {
            from_user_id: uploaderId,
            from_username: uploaderUsername,
            date_id: dateId,
            date_title: dateTitle,
            photo_count: photoCount,
            text: `${uploaderUsername} added ${photoCount} photo${photoCount > 1 ? "s" : ""} to "${dateTitle}"`,
        },
    });
}

/**
 * Send notification when someone comments on a date
 */
export async function notifyComment(
    ownerId: string,
    commenterId: string,
    commenterUsername: string,
    dateId: string,
    dateTitle: string,
    commentPreview?: string
): Promise<void> {
    await createNotification({
        user_id: ownerId,
        type: "COMMENT",
        message: {
            from_user_id: commenterId,
            from_username: commenterUsername,
            date_id: dateId,
            date_title: dateTitle,
            comment_text: commentPreview,
            text: `${commenterUsername} commented on "${dateTitle}"`,
        },
    });
}

/**
 * Send a general notification
 */
export async function notifyGeneral(
    userId: string,
    text: string,
    additionalData?: Record<string, unknown>
): Promise<void> {
    await createNotification({
        user_id: userId,
        type: "GENERAL",
        message: {
            text,
            ...additionalData,
        },
    });
}

/**
 * Create notification only if user has notifications enabled (alias for createNotification)
 */
export async function createNotificationIfEnabled(payload: NotificationPayload): Promise<string | null> {
    return createNotification(payload);
}
