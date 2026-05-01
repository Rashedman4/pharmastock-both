import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';

export async function PATCH(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const result = await pool.query(
    `UPDATE in_app_notifications
     SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL`,
    [payload.userId]
  );

  return ok({ updated: result.rowCount ?? 0 });
}
