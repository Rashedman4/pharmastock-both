import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return null;
  const authorized = process.env.AUTHORIZED_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  if (!authorized.includes(token.email as string)) return null;
  return token;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: campaignId } = await ctx.params;
  const { page, limit, offset } = parsePaginationParams(req);

  const [countRes, dataRes] = await Promise.all([
    pool.query(
      'SELECT COUNT(*) FROM broadcast_recipients WHERE campaign_id = $1',
      [campaignId]
    ),
    pool.query(
      `SELECT br.id, br.user_id, br.delivered_at,
              u.firstname, u.lastname, u.email
       FROM broadcast_recipients br
       LEFT JOIN users u ON u.id = br.user_id
       WHERE br.campaign_id = $1
       ORDER BY br.id
       LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    ),
  ]);

  const total = parseInt(countRes.rows[0].count, 10);

  return NextResponse.json({
    data: dataRes.rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
}
