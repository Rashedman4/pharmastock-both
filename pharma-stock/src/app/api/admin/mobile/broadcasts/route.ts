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

export async function GET(req: NextRequest) {
  const token = await assertAdmin(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { page, limit, offset } = parsePaginationParams(req);

  const [countRes, dataRes] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM broadcast_campaigns'),
    pool.query(
      `SELECT bc.*, u.firstname, u.lastname
       FROM broadcast_campaigns bc
       LEFT JOIN users u ON u.id = bc.admin_id
       ORDER BY bc.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  const total = parseInt(countRes.rows[0].count, 10);
  return NextResponse.json({
    data: dataRes.rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(req: NextRequest) {
  const token = await assertAdmin(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, messageType, content, attachmentUrl, attachmentMetadata, audienceType, scheduledAt } =
    body as {
      title?: string;
      messageType?: string;
      content?: string;
      attachmentUrl?: string;
      attachmentMetadata?: Record<string, unknown>;
      audienceType?: string;
      scheduledAt?: string;
    };

  if (!title || !messageType || !audienceType) {
    return NextResponse.json(
      { error: 'title, messageType, and audienceType are required' },
      { status: 400 }
    );
  }

  // Look up admin's user id from their email
  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [token.email]);
  if (!userRes.rows.length) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
  }
  const adminId = userRes.rows[0].id;

  const status = scheduledAt ? 'scheduled' : 'draft';

  const result = await pool.query(
    `INSERT INTO broadcast_campaigns
       (admin_id, title, message_type, content, attachment_url, attachment_metadata,
        audience_type, status, scheduled_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      adminId,
      title,
      messageType,
      content ?? null,
      attachmentUrl ?? null,
      JSON.stringify(attachmentMetadata ?? {}),
      audienceType,
      status,
      scheduledAt ?? null,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
