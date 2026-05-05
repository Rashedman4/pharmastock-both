import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req });
  return token?.role === 'admin' ? token : null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId } = await ctx.params;

  // Load conversation + user info
  const convRes = await pool.query(
    `SELECT cc.*, u.firstname, u.lastname, u.email,
            EXISTS(SELECT 1 FROM elite_members em WHERE em.user_id = u.id) AS is_elite
     FROM chat_conversations cc
     JOIN users u ON u.id = cc.user_id
     WHERE cc.id = $1`,
    [conversationId]
  );
  if (!convRes.rows.length) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Load messages oldest-first, capped at 500 to prevent OOM on very long conversations
  const msgRes = await pool.query(
    `SELECT * FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT 500`,
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
