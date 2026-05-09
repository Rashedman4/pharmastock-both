import pool from '../db';
import { sendPushToUser, sendBilingualPushToAllUsers } from './push.service';

export interface BilingualNotificationInput {
  type: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  data?: Record<string, unknown>;
}

interface CreateNotificationInput extends BilingualNotificationInput {
  userId: number;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // Look up user's language preference
  const langResult = await pool.query(
    'SELECT preferred_language FROM users WHERE id = $1',
    [input.userId]
  );
  const lang = (langResult.rows[0]?.preferred_language as string) ?? 'en';
  const pushTitle = lang === 'ar' ? input.title_ar : input.title_en;
  const pushBody  = lang === 'ar' ? input.body_ar  : input.body_en;

  await pool.query(
    `INSERT INTO in_app_notifications
       (user_id, type, title, body, title_en, title_ar, body_en, body_ar, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.userId,
      input.type,
      input.title_en,
      input.body_en,
      input.title_en,
      input.title_ar,
      input.body_en,
      input.body_ar,
      JSON.stringify(input.data ?? {}),
    ]
  );

  await sendPushToUser(input.userId, {
    title: pushTitle,
    body: pushBody,
    data: input.data,
  });
}

export async function createNotificationForAll(
  input: BilingualNotificationInput
): Promise<void> {
  // Insert in-app notification for every user (store both languages)
  await pool.query(
    `INSERT INTO in_app_notifications
       (user_id, type, title, body, title_en, title_ar, body_en, body_ar, data)
     SELECT id, $1, $2, $3, $4, $5, $6, $7, $8
     FROM users`,
    [
      input.type,
      input.title_en,
      input.body_en,
      input.title_en,
      input.title_ar,
      input.body_en,
      input.body_ar,
      JSON.stringify(input.data ?? {}),
    ]
  );

  // Send push per language group
  await sendBilingualPushToAllUsers({
    en: { title: input.title_en, body: input.body_en },
    ar: { title: input.title_ar, body: input.body_ar },
    data: input.data,
  });
}
