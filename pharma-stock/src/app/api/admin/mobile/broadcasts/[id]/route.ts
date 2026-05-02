import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

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

  const { id } = await ctx.params;

  const result = await pool.query(
    `SELECT bc.*, u.firstname, u.lastname,
            (SELECT COUNT(*) FROM broadcast_recipients br WHERE br.campaign_id = bc.id) AS recipient_count_actual,
            (SELECT COUNT(*) FROM broadcast_recipients br WHERE br.campaign_id = bc.id AND br.delivered_at IS NOT NULL) AS delivered_count
     FROM broadcast_campaigns bc
     LEFT JOIN users u ON u.id = bc.admin_id
     WHERE bc.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
