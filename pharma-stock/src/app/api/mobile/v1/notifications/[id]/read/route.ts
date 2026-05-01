import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const { id } = await params;

  const result = await pool.query(
    `UPDATE in_app_notifications
     SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING id`,
    [id, payload.userId]
  );

  if (result.rowCount === 0) {
    return err('NOT_FOUND', 'Notification not found or already read', 404);
  }

  return ok({ id });
}
