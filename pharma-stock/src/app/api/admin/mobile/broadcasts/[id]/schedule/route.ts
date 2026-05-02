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

export async function POST(req: NextRequest, ctx: Ctx) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: campaignId } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body?.scheduledAt) {
    return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });
  }

  const scheduledAt = new Date(body.scheduledAt);
  if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return NextResponse.json(
      { error: 'scheduledAt must be a valid future date' },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE broadcast_campaigns
     SET status = 'scheduled', scheduled_at = $1
     WHERE id = $2
     RETURNING *`,
    [scheduledAt.toISOString(), campaignId]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
