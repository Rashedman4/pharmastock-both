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

  const { id: conversationId } = await ctx.params;

  // Load conversation + user info
  const convRes = await pool.query(
    `SELECT cc.*, u.firstname, u.lastname, u.email
     FROM chat_conversations cc
     JOIN users u ON u.id = cc.user_id
     WHERE cc.id = $1`,
    [conversationId]
  );
  if (!convRes.rows.length) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Load all messages, oldest first
  const msgRes = await pool.query(
    `SELECT * FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  // Reset admin unread count — admin is now reading this conversation
  await pool.query(
    'UPDATE chat_conversations SET admin_unread_count = 0 WHERE id = $1',
    [conversationId]
  );

  return NextResponse.json({
    conversation: convRes.rows[0],
    messages: msgRes.rows,
  });
}
