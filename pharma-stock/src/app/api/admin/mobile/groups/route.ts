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

export async function GET(req: NextRequest) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await pool.query(
    `SELECT bg.*,
            COUNT(bc.id)::int AS message_count,
            MAX(bc.sent_at) AS last_sent_at
     FROM broadcast_groups bg
     LEFT JOIN broadcast_campaigns bc ON bc.group_id = bg.id
     GROUP BY bg.id
     ORDER BY bg.created_at DESC`
  );

  return NextResponse.json({ data: result.rows });
}

export async function POST(req: NextRequest) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { name, audienceType, customUserIds } = body as {
    name?: string;
    audienceType?: string;
    customUserIds?: number[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!audienceType) {
    return NextResponse.json({ error: 'audienceType is required' }, { status: 400 });
  }
  if (audienceType === 'custom' && (!customUserIds || customUserIds.length === 0)) {
    return NextResponse.json({ error: 'Select at least one user for custom audience' }, { status: 400 });
  }

  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [token.email]);
  if (!userRes.rows.length) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  const adminId = userRes.rows[0].id;

  const result = await pool.query(
    `INSERT INTO broadcast_groups (admin_id, name, audience_type, custom_user_ids)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [adminId, name.trim(), audienceType, customUserIds ?? []]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
