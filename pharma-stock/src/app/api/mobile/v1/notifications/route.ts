import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

export async function GET(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const { page, limit, offset } = parsePaginationParams(req);

  const [countResult, dataResult] = await Promise.all([
    pool.query(
      'SELECT COUNT(*) FROM in_app_notifications WHERE user_id = $1',
      [payload.userId]
    ),
    pool.query(
      `SELECT id, type, title, body, data, read_at, created_at
       FROM in_app_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [payload.userId, limit, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);
  const pagination = buildPaginationMeta(total, page, limit);

  return ok({ data: dataResult.rows, pagination });
}
