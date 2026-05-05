import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req });
  return token?.role === 'admin' ? token : null;
}

export async function GET(req: NextRequest) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { page, limit, offset } = parsePaginationParams(req);

  const [countRes, dataRes] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM chat_conversations WHERE last_message_at IS NOT NULL'),
    pool.query(
      `SELECT
         cc.id,
         cc.user_id,
         cc.last_message_at,
         cc.last_message_preview,
         cc.admin_unread_count,
         cc.user_unread_count,
         cc.created_at,
         u.firstname,
         u.lastname,
         u.email,
         EXISTS(SELECT 1 FROM elite_members em WHERE em.user_id = u.id) AS is_elite
       FROM chat_conversations cc
       JOIN users u ON u.id = cc.user_id
       WHERE cc.last_message_at IS NOT NULL
       ORDER BY cc.last_message_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  const total: number = countRes.rows[0].total;
  return NextResponse.json({ data: dataRes.rows, pagination: buildPaginationMeta(total, page, limit) });
}
