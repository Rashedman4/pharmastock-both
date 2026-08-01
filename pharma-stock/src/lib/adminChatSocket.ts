"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;

// Lazily creates a single shared Socket.IO connection for the admin panel,
// authenticated via the browser's NextAuth session cookie (see
// getAdminSocketAuth in src/lib/socket/socket-server.ts, which joins
// authenticated admin sockets to the 'admin' room). This is a pure
// enhancement layer on top of the admin messages page's existing SWR
// polling — if it never connects (network issue, cookie not recognized,
// etc.) callers simply keep getting updates from that polling, exactly as
// before this was added.
function getAdminSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    sharedSocket.on("connect_error", (err) => {
      console.warn("[adminChatSocket] connection error (falling back to polling):", err.message);
    });
  }
  return sharedSocket;
}

/**
 * Subscribes to live "new message" notifications for the admin chat panel.
 * Calls `onMessage` whenever a user sends a message (via socket or the REST
 * API — both paths emit the same events) so the page can eagerly revalidate
 * its SWR data instead of waiting for the next poll. Existing polling is
 * left untouched as a fallback; this only makes updates arrive sooner when
 * it's connected.
 */
export function useAdminChatSocket(onMessage: () => void): void {
  useEffect(() => {
    let socket: Socket;
    try {
      socket = getAdminSocket();
    } catch (err) {
      console.warn("[adminChatSocket] unavailable, relying on polling only:", err);
      return;
    }

    const handle = () => onMessage();
    socket.on("new_message", handle);
    socket.on("new_user_message", handle);

    return () => {
      socket.off("new_message", handle);
      socket.off("new_user_message", handle);
    };
  }, [onMessage]);
}
