import { NextRequest } from 'next/server';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';
import { chatService } from '@/lib/services/chat.service';
import { createRateLimiter, rateLimitResponse, getClientIP } from '@/lib/mobile/rate-limit';
import { getIO } from '@/lib/socket/socket-server';
import { sendEmailNotification } from '@/lib/emailService';

const messageLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyFn: (req) => req.headers.get('authorization') ?? getClientIP(req),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const { id: conversationId } = await ctx.params;

  const owns = await chatService.userOwnsConversation(payload.userId, conversationId);
  if (!owns) return err('FORBIDDEN', 'Access denied', 403);

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '30', 10));
  const direction = (url.searchParams.get('direction') ?? 'before') as 'before' | 'after';

  const { messages, nextCursor } = await chatService.getMessages(
    conversationId,
    cursor,
    limit,
    direction
  );

  // Reset user unread count and mark admin's messages as seen when they load the thread
  await chatService.resetUnreadCount(conversationId, 'user');
  await chatService.markConversationReadByUser(conversationId, payload.userId);

  return ok({ data: messages, nextCursor });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  if (!messageLimiter(req)) return rateLimitResponse();

  const { id: conversationId } = await ctx.params;

  const owns = await chatService.userOwnsConversation(payload.userId, conversationId);
  if (!owns) return err('FORBIDDEN', 'Access denied', 403);

  const body = await req.json().catch(() => null);
  if (!body) return err('BAD_REQUEST', 'Invalid JSON body', 400);

  const { type, content, attachmentUrl, attachmentMetadata } = body as {
    type?: string;
    content?: string;
    attachmentUrl?: string;
    attachmentMetadata?: Record<string, unknown>;
  };

  const validTypes = ['text', 'image', 'voice', 'video', 'file'];
  if (!type || !validTypes.includes(type)) {
    return err('BAD_REQUEST', 'type must be one of: text, image, voice, video, file', 400);
  }

  if (type === 'text' && !content?.trim()) {
    return err('BAD_REQUEST', 'content is required for text messages', 400, 'content');
  }
  if (content && content.length > 4000) {
    return err('BAD_REQUEST', 'Message content must not exceed 4000 characters', 400, 'content');
  }
  if (attachmentUrl && !attachmentUrl.startsWith('https://res.cloudinary.com/')) {
    return err('BAD_REQUEST', 'attachmentUrl must be a valid Cloudinary URL', 400, 'attachmentUrl');
  }

  const message = await chatService.createMessage({
    conversationId,
    senderType: 'user',
    senderId: payload.userId,
    messageType: type as 'text' | 'image' | 'voice' | 'video' | 'file',
    content,
    attachmentUrl,
    attachmentMetadata,
  });

  // Emit via Socket.IO if available (REST fallback still works without socket)
  const io = getIO();
  if (io) {
    io.to(`conv:${conversationId}`).emit('new_message', message);
    io.to('admin').emit('new_user_message', {
      conversationId,
      userId: payload.userId,
      message,
    });
  }

  notifyAdminsOfUserMessage(payload.email, conversationId, type, content).catch((error) => {
    console.error('[EmailNotification] new_user_chat_message:', error);
  });

  return ok(message, 201);
}

async function notifyAdminsOfUserMessage(
  senderEmail: string,
  conversationId: string,
  messageType: string,
  content?: string
) {
  const authorizedEmails = (process.env.AUTHORIZED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  if (!authorizedEmails.length) return;

  const preview =
    messageType === 'text'
      ? (content?.trim() ?? '').slice(0, 200)
      : `[${messageType} message]`;

  const message = `${senderEmail} sent a new message: "${preview}"\n\nConversation reference: ${conversationId}\nReply from the admin messages dashboard.`;

  await Promise.all(
    authorizedEmails.map((adminEmail) =>
      sendEmailNotification(adminEmail, 'New Chat Message', message).catch((error) =>
        console.error(`[EmailNotification] failed for ${adminEmail}:`, error)
      )
    )
  );
}
