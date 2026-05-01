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
  const result = await pool.query('SELECT expo_token FROM user_push_tokens');
  console.log(`[Push] sendPushToAllUsers: found ${result.rows.length} token(s) in DB`);
  const messages: ExpoPushMessage[] = result.rows
    .filter((r: { expo_token: string }) => Expo.isExpoPushToken(r.expo_token))
    .map((r: { expo_token: string }) => ({
      to: r.expo_token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default' as const,
    }));
  console.log(`[Push] Sending to ${messages.length} valid token(s)`);
  await _sendChunked(messages);
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
