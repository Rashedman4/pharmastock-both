import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';

export async function PATCH(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const body = await req.json().catch(() => ({}));
  const { language } = body as { language?: string };

  if (!language || !['en', 'ar'].includes(language)) {
    return err('VALIDATION_ERROR', 'language must be "en" or "ar"', 400, 'language');
  }

  await pool.query(
    'UPDATE users SET preferred_language = $1 WHERE id = $2',
    [language, payload.userId]
  );

  return ok({ updated: true });
}
