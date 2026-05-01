import { NextRequest } from 'next/server';
import Expo from 'expo-server-sdk';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';

export async function POST(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const body = await req.json();
  const { token, platform, deviceId } = body as {
    token?: string;
    platform?: string;
    deviceId?: string;
  };

  if (!token || typeof token !== 'string') {
    return err('VALIDATION_ERROR', 'Push token is required', 400, 'token');
  }
  if (!Expo.isExpoPushToken(token)) {
    return err('VALIDATION_ERROR', 'Invalid Expo push token format', 400, 'token');
  }
  if (platform && !['ios', 'android'].includes(platform)) {
    return err('VALIDATION_ERROR', 'Platform must be ios or android', 400, 'platform');
  }

  await pool.query(
    `INSERT INTO user_push_tokens (user_id, expo_token, device_id, platform)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, expo_token) DO UPDATE SET updated_at = NOW()`,
    [payload.userId, token, deviceId ?? null, platform ?? null]
  );

  return ok({ registered: true }, 201);
}

export async function DELETE(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const body = await req.json();
  const { token } = body as { token?: string };

  if (!token) return err('VALIDATION_ERROR', 'Push token is required', 400, 'token');

  await pool.query(
    'DELETE FROM user_push_tokens WHERE user_id = $1 AND expo_token = $2',
    [payload.userId, token]
  );

  return new Response(null, { status: 204 });
}
