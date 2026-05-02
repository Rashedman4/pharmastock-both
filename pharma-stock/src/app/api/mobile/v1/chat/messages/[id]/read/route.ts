import { NextRequest } from 'next/server';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';
import { chatService } from '@/lib/services/chat.service';
import { getIO } from '@/lib/socket/socket-server';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  const { id: messageId } = await ctx.params;

  await chatService.markMessageRead(messageId, payload.userId);

  const msg = await chatService.getMessage(messageId);
  if (msg) {
    const io = getIO();
    if (io) {
      io.to(`conv:${msg.conversationId}`).emit('message_read', { messageId });
    }
  }

  return ok({ success: true });
}
