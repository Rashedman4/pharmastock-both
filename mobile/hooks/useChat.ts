import { useEffect, useRef, useCallback } from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markMessageRead,
} from '@/services/chat.service';
import { connectSocket, getSocket } from '@/lib/socket';
import type { ChatMessage, Conversation } from '@/types/content';

const KEYS = {
  conversations: ['chat', 'conversations'] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: KEYS.conversations,
    queryFn: fetchConversations,
    select: (res) => res.data as Conversation[],
    staleTime: 10_000,
    refetchInterval: 10_000, // refresh conversation list every 10s
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: KEYS.messages(conversationId),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      fetchMessages(conversationId, pageParam, 30),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    // Poll every 4 seconds as a Socket.IO fallback — ensures messages appear
    // even when the WebSocket connection is unstable or the custom server
    // isn't running. Socket.IO still delivers instantly when connected.
    refetchInterval: 4_000,
    refetchIntervalInBackground: false,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof sendMessage>[1]) =>
      sendMessage(conversationId, body),
    onSuccess: (message) => {
      qc.setQueryData(
        KEYS.messages(conversationId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old) return old;
          const pages = [...old.pages];
          const existing: ChatMessage[] = pages[0]?.data ?? [];
          if (existing.some((m) => m.id === message.id)) return old;
          pages[0] = { ...pages[0], data: [...existing, message] };
          return { ...old, pages };
        }
      );
      qc.invalidateQueries({ queryKey: KEYS.conversations });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markMessageRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.conversations });
    },
  });
}

export function useSocketMessages(
  conversationId: string,
  onTyping: (typing: boolean) => void
) {
  const qc = useQueryClient();
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to onTyping so the effect doesn't re-run when the callback identity changes
  const onTypingRef = useRef(onTyping);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);

  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      qc.setQueryData(
        KEYS.messages(conversationId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old) return old;
          const pages = [...old.pages];
          const existing = pages[0]?.data ?? [];
          if (existing.some((m: ChatMessage) => m.id === message.id)) return old;
          pages[0] = { ...pages[0], data: [...existing, message] };
          return { ...old, pages };
        }
      );
      qc.invalidateQueries({ queryKey: KEYS.conversations });
    },
    [conversationId, qc]
  );

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join_conversation', conversationId);

    socket.on('new_message', handleNewMessage);

    const handleTyping = () => {
      onTypingRef.current(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => onTypingRef.current(false), 3000);
    };
    const handleStopTyping = () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      onTypingRef.current(false);
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStopTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [conversationId, handleNewMessage]);
}

export function useChatConnection() {
  useEffect(() => {
    connectSocket();
  }, []); // only once on mount

  return getSocket();
}

export { KEYS as chatKeys };
