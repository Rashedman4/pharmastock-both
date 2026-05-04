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
       u.email
     FROM chat_conversations cc
     JOIN users u ON u.id = cc.user_id
     WHERE cc.last_message_at IS NOT NULL
     ORDER BY cc.last_message_at DESC`
  );

  return NextResponse.json({ data: result.rows });
}
