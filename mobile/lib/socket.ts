import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  // If socket already exists (connected or reconnecting), reuse it — don't create a new instance.
  // Creating a new instance orphans the old event listeners attached by useSocketMessages.
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000', {
    // Callback form: called before every connection attempt (including reconnects)
    // so the socket always uses the current token, even after a refresh cycle.
    auth: (cb: (data: { token: string | null }) => void) => {
      cb({ token: useAuthStore.getState().accessToken });
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
    timeout: 20_000,
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] connect_error:', err.message);
  });

  socket.on('connect', () => {
    console.log('[Socket] connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnected:', reason);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
