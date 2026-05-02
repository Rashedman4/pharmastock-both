import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../mobile/jwt';
import { chatService } from '../services/chat.service';

// Store io on global so it survives Next.js hot reloads in dev
const g = global as typeof globalThis & { _socketIO?: Server };

export function getIO(): Server | null {
  return g._socketIO ?? null;
}

export function initSocketIO(io: Server): void {
  g._socketIO = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));

    const payload = verifyAccessToken(token);
    if (!payload) return next(new Error('Invalid token'));

    socket.data.userId = payload.userId;
    socket.data.email = payload.email;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as number;

    // Auto-join personal room so admin can reach this user
    socket.join(`user:${userId}`);

    socket.on('join_conversation', async (conversationId: string) => {
      const owns = await chatService.userOwnsConversation(userId, conversationId);
      if (!owns) {
        socket.emit('error', { code: 'FORBIDDEN' });
        return;
      }
      socket.join(`conv:${conversationId}`);
    });

    socket.on('send_message', async (data: {
      conversationId: string;
      type: 'text' | 'image' | 'voice' | 'video';
      content?: string;
      attachmentUrl?: string;
      attachmentMetadata?: Record<string, unknown>;
    }) => {
      try {
        const owns = await chatService.userOwnsConversation(userId, data.conversationId);
        if (!owns) {
          socket.emit('error', { code: 'FORBIDDEN' });
          return;
        }

        const message = await chatService.createMessage({
          conversationId: data.conversationId,
          senderType: 'user',
          senderId: userId,
          messageType: data.type,
          content: data.content,
          attachmentUrl: data.attachmentUrl,
          attachmentMetadata: data.attachmentMetadata,
        });

        io.to(`conv:${data.conversationId}`).emit('new_message', message);
        io.to('admin').emit('new_user_message', { conversationId: data.conversationId, userId, message });
      } catch {
        socket.emit('error', { code: 'SEND_FAILED' });
      }
    });

    socket.on('mark_read', async (messageId: string) => {
      try {
        await chatService.markMessageRead(messageId, userId);
        const msg = await chatService.getMessage(messageId);
        if (msg) {
          io.to(`conv:${msg.conversationId}`).emit('message_read', { messageId });
        }
      } catch {
        // silently fail
      }
    });

    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', { userId, conversationId });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('user_stopped_typing', { userId, conversationId });
    });
  });
}
