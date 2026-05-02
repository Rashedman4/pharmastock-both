import { NextRequest } from 'next/server';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ok, err } from '@/lib/mobile/api-handler';
import { chatService } from '@/lib/services/chat.service';

export async function GET(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  let conversations = await chatService.getUserConversations(payload.userId);

  // Auto-create a conversation so the user always has an admin channel
  if (conversations.length === 0) {
    const conv = await chatService.getOrCreateConversation(payload.userId);
    conversations = [conv];
  }

  return ok({ data: conversations });
}
