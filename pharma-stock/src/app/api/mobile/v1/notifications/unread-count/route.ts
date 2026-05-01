import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';

export async function GET(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const result = await pool.query(
    'SELECT COUNT(*) FROM in_app_notifications WHERE user_id = $1 AND read_at IS NULL',
    [payload.userId]
  );

  return ok({ count: parseInt(result.rows[0].count, 10) });
}
