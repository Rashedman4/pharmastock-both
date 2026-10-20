import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import { insertNotificationForAllUsers } from "@/lib/services/notification.service";
import { sendBilingualPushToAllUsers } from "@/lib/services/push.service";
import { logAlertFailure } from "@/lib/services/content-alert.service";

/**
 * Admin-authored notification to every user, in both languages.
 *
 * The general-purpose sender: whatever the announcement is, the admin writes
 * the English and Arabic title/body and every user gets it in their own
 * `preferred_language` — in the Notifications tab (from `in_app_notifications`)
 * and as a push.
 *
 * Tapping it opens the Notifications tab: `type` is `admin_message` and the
 * payload carries no `screen`, so mobile's `handleNotificationTap` falls into
 * its `default` branch (PROJECT_CONTEXT §6 — that branch must stay).
 *
 * The rows are written before the response so the admin gets a real recipient
 * count; the pushes go out fire-and-forget, because Expo being down must not
 * turn a delivered notification into a failed request.
 */

export const NOTIFICATION_TYPE = "admin_message";

const sendSchema = z.object({
  title: z.object({
    en: z.string().trim().min(1, "English title is required").max(120),
    ar: z.string().trim().min(1, "Arabic title is required").max(120),
  }),
  body: z.object({
    en: z.string().trim().min(1, "English message is required").max(1000),
    ar: z.string().trim().min(1, "Arabic message is required").max(1000),
  }),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { title, body } = parsed.data;

  try {
    const recipients = await insertNotificationForAllUsers({
      type: NOTIFICATION_TYPE,
      title_en: title.en,
      title_ar: title.ar,
      body_en: body.en,
      body_ar: body.ar,
    });

    void sendBilingualPushToAllUsers({
      en: { title: title.en, body: body.en },
      ar: { title: title.ar, body: body.ar },
    }).catch(logAlertFailure("admin notification push"));

    return NextResponse.json({ recipients }, { status: 201 });
  } catch (error) {
    console.error("[admin/notifications] POST error", error);
    return NextResponse.json(
      { error: "Error sending notification" },
      { status: 500 }
    );
  }
}

/**
 * The last 20 admin notifications, so it is obvious whether something was
 * already sent. Every row from one send shares a `created_at`, which is what
 * groups them back together.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const { rows } = await pool.query(
      `SELECT title_en, title_ar, body_en, body_ar, created_at,
              COUNT(*)::int AS recipients
       FROM in_app_notifications
       WHERE type = $1 AND created_at > NOW() - INTERVAL '90 days'
       GROUP BY title_en, title_ar, body_en, body_ar, created_at
       ORDER BY created_at DESC
       LIMIT 20`,
      [NOTIFICATION_TYPE]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[admin/notifications] GET error", error);
    return NextResponse.json(
      { error: "Error fetching sent notifications" },
      { status: 500 }
    );
  }
}
