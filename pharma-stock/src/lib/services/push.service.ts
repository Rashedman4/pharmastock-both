import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import pool from '../db';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  const result = await pool.query(
    'SELECT expo_token FROM user_push_tokens WHERE user_id = $1',
    [userId]
  );
  const tokens: string[] = result.rows.map((r: { expo_token: string }) => r.expo_token);
  await _sendToTokens(tokens, payload);
}

export async function sendPushToAllUsers(payload: PushPayload): Promise<void> {
  const BATCH_SIZE = 500;
  let offset = 0;
  let totalSent = 0;

  while (true) {
    const result = await pool.query(
      'SELECT expo_token FROM user_push_tokens LIMIT $1 OFFSET $2',
      [BATCH_SIZE, offset]
    );
    if (!result.rows.length) break;

    const messages: ExpoPushMessage[] = result.rows
      .filter((r: { expo_token: string }) => Expo.isExpoPushToken(r.expo_token))
      .map((r: { expo_token: string }) => ({
        to: r.expo_token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: 'default' as const,
      }));

    await _sendChunked(messages);
    totalSent += messages.length;

    if (result.rows.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  console.log(`[Push] sendPushToAllUsers: sent to ${totalSent} token(s)`);
}

interface BilingualPushPayload {
  en: { title: string; body: string };
  ar: { title: string; body: string };
  data?: Record<string, unknown>;
}

// Sends push notifications in each user's preferred language
export async function sendBilingualPushToAllUsers(payload: BilingualPushPayload): Promise<void> {
  const BATCH_SIZE = 500;
  let offset = 0;
  let totalSent = 0;

  while (true) {
    const result = await pool.query(
      `SELECT t.expo_token, COALESCE(u.preferred_language, 'en') AS lang
       FROM user_push_tokens t
       JOIN users u ON u.id = t.user_id
       LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );
    if (!result.rows.length) break;

    const messages: ExpoPushMessage[] = result.rows
      .filter((r: { expo_token: string }) => Expo.isExpoPushToken(r.expo_token))
      .map((r: { expo_token: string; lang: string }) => {
        const p = r.lang === 'ar' ? payload.ar : payload.en;
        return {
          to: r.expo_token,
          title: p.title,
          body: p.body,
          data: payload.data ?? {},
          sound: 'default' as const,
        };
      });

    await _sendChunked(messages);
    totalSent += messages.length;

    if (result.rows.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  console.log(`[Push] sendBilingualPushToAllUsers: sent to ${totalSent} token(s)`);
}

async function _sendToTokens(tokens: string[], payload: PushPayload): Promise<void> {
  const valid = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (!valid.length) return;
  const messages: ExpoPushMessage[] = valid.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default' as const,
  }));
  await _sendChunked(messages);
}

async function _sendChunked(messages: ExpoPushMessage[]): Promise<void> {
  if (!messages.length) return;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'ok') {
          console.log(`[Push] Ticket OK, id: ${ticket.id}`);
        } else {
          console.error(`[Push] Ticket error for token ${(chunk[i] as ExpoPushMessage & { to: string })?.to}:`, ticket.message, ticket.details);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const token = (chunk[i] as ExpoPushMessage & { to: string })?.to;
            if (token) {
              await pool.query('DELETE FROM user_push_tokens WHERE expo_token = $1', [token]);
              console.log('[Push] Removed stale token:', token);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Push] Failed to send chunk:', err);
    }
  }
}
