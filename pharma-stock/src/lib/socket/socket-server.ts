import { Server, Socket } from 'socket.io';
import { decode as decodeNextAuthJWT } from 'next-auth/jwt';
import { verifyAccessToken } from '../mobile/jwt';
import { chatService } from '../services/chat.service';

// Store io on global so it survives Next.js hot reloads in dev
const g = global as typeof globalThis & { _socketIO?: Server };

export function getIO(): Server | null {
  return g._socketIO ?? null;
}

// The mobile app authenticates with its own short-lived JWT access token
// (verifyAccessToken, above) passed as socket.handshake.auth.token. The
// admin web panel has no such token — it has a NextAuth session cookie
// instead — so browser (non-mobile) connections are authenticated by
// decoding that cookie directly. This only grants access to the 'admin'
// broadcast room (see io.on('connection') below); it never touches the
// mobile token path, which is checked first and is unchanged.
function extractNextAuthSessionCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const name of ['__Secure-next-auth.session-token', 'next-auth.session-token']) {
    const match = cookies.find((c) => c.startsWith(`${name}=`));
    if (match) return decodeURIComponent(match.slice(name.length + 1));
  }
  return null;
}

async function getAdminSocketAuth(
  cookieHeader?: string,
): Promise<{ userId: number; email: string } | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const raw = extractNextAuthSessionCookie(cookieHeader);
  if (!raw) return null;

  try {
    const token = await decodeNextAuthJWT({ token: raw, secret });
    if (!token || token.role !== 'admin' || !token.id) return null;
    return { userId: Number(token.id), email: String(token.email || '') };
  } catch {
    return null;
  }
}

export function initSocketIO(io: Server): void {
  g._socketIO = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      const payload = verifyAccessToken(token);
      if (!payload) return next(new Error('Invalid token'));
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      socket.data.isAdmin = false;
      return next();
    }

    // No mobile token supplied — allow an admin's authenticated browser
    // session to connect too, purely so it can join the 'admin' room and
    // receive live chat notifications (existing behavior for every other
    // unauthenticated connection is unchanged: reject).
    try {
      const admin = await getAdminSocketAuth(socket.handshake.headers.cookie);
      if (admin) {
        socket.data.userId = admin.userId;
        socket.data.email = admin.email;
        socket.data.isAdmin = true;
        return next();
      }
    } catch {
      // fall through to rejection below
    }

    return next(new Error('Authentication required'));
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as number;

    // Auto-join personal room so admin can reach this user
    socket.join(`user:${userId}`);

    if (socket.data.isAdmin) {
      // Lets io.to('admin').emit(...) (used elsewhere for new-message
      // notifications) actually reach a connected admin browser session.
      socket.join('admin');
    }

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
