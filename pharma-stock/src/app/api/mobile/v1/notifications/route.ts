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
      `SELECT
         n.id,
         n.type,
         CASE
           WHEN u.preferred_language = 'ar' AND n.title_ar IS NOT NULL THEN n.title_ar
           ELSE COALESCE(n.title_en, n.title)
         END AS title,
         CASE
           WHEN u.preferred_language = 'ar' AND n.body_ar IS NOT NULL THEN n.body_ar
           ELSE COALESCE(n.body_en, n.body)
         END AS body,
         n.data,
         n.read_at,
         n.created_at
       FROM in_app_notifications n
       JOIN users u ON u.id = n.user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [payload.userId, limit, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);
  const pagination = buildPaginationMeta(total, page, limit);

  return ok({ data: dataResult.rows, pagination });
}
