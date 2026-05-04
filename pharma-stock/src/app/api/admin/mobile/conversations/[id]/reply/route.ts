import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { chatService } from '@/lib/services/chat.service';
import { sendPushToUser } from '@/lib/services/push.service';
import { getIO } from '@/lib/socket/socket-server';

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

  const { id: conversationId } = await ctx.params;

  const convRes = await pool.query(
    'SELECT id, user_id FROM chat_conversations WHERE id = $1',
    [conversationId]
  );
  if (!convRes.rows.length) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  const { user_id: userId } = convRes.rows[0];

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const {
    content,
    messageType = 'text',
    attachmentUrl,
    attachmentMetadata,
  } = body as {
    content?: string;
    messageType?: string;
    attachmentUrl?: string;
    attachmentMetadata?: Record<string, unknown>;
  };

  if (messageType === 'text' && !content?.trim()) {
    return NextResponse.json({ error: 'content is required for text messages' }, { status: 400 });
  }
  if (messageType !== 'text' && !attachmentUrl) {
    return NextResponse.json({ error: 'attachmentUrl is required for media messages' }, { status: 400 });
  }

  const adminRes = await pool.query('SELECT id FROM users WHERE email = $1', [token.email]);
  if (!adminRes.rows.length) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  const adminId = adminRes.rows[0].id;

  const message = await chatService.createMessage({
    conversationId,
    senderType: 'admin',
    senderId: adminId,
    messageType: messageType as 'text' | 'image' | 'voice' | 'video' | 'file',
    content: content?.trim(),
    attachmentUrl,
    attachmentMetadata,
  });

  await chatService.resetUnreadCount(conversationId, 'admin');

  const io = getIO();
  if (io) io.to(`user:${userId}`).emit('new_message', message);

  const pushBody =
    messageType === 'text'
      ? (content?.trim() ?? '').slice(0, 80)
      : messageType === 'voice'
      ? '🎙️ Voice note'
      : '🖼️ Image';

  await sendPushToUser(userId, {
    title: '💬 New message',
    body: pushBody,
    data: { type: 'chat_message', conversationId, screen: 'chat' },
  }).catch(() => {});

  return NextResponse.json(message, { status: 201 });
}
