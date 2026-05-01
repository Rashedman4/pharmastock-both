import pool from '../db';
import { sendPushToUser, sendPushToAllUsers } from './push.service';

interface CreateNotificationInput {
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await pool.query(
    `INSERT INTO in_app_notifications (user_id, type, title, body, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.userId, input.type, input.title, input.body, JSON.stringify(input.data ?? {})]
  );
  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    data: input.data,
  });
}

export async function createNotificationForAll(
  input: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  // Insert in-app notification for every user
  await pool.query(
    `INSERT INTO in_app_notifications (user_id, type, title, body, data)
     SELECT id, $1, $2, $3, $4
     FROM users`,
    [input.type, input.title, input.body, JSON.stringify(input.data ?? {})]
  );
  // Send push only to users who have registered a token
  await sendPushToAllUsers({
    title: input.title,
    body: input.body,
    data: input.data,
  });
}
