import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { ChatMessage, Conversation } from '@/types/content';

export async function fetchConversations(): Promise<{ data: Conversation[] }> {
  const { data } = await apiClient.get(API_ROUTES.chat.conversations);
  return data;
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
  limit = 30
): Promise<{ data: ChatMessage[]; nextCursor: string | null }> {
  const { data } = await apiClient.get(
    API_ROUTES.chat.messages(conversationId),
    { params: { cursor, limit, direction: 'before' } }
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  body: {
    type: 'text' | 'image' | 'voice' | 'video';
    content?: string;
    attachmentUrl?: string;
    attachmentMetadata?: Record<string, unknown>;
  }
): Promise<ChatMessage> {
  const { data } = await apiClient.post(
    API_ROUTES.chat.messages(conversationId),
    body
  );
  return data;
}

export async function markMessageRead(messageId: string): Promise<void> {
  await apiClient.post(API_ROUTES.chat.markRead(messageId));
}

export async function uploadChatMedia(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<{
  url: string;
  type: 'image' | 'voice' | 'video';
  size: number;
  duration: number | null;
  width: number | null;
  height: number | null;
}> {
  const buildForm = () => {
    const form = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
    return form;
  };

  // 60s timeout: dev-mode Next.js compiles the route on first hit (~5-30s),
  // plus actual upload time to Cloudinary.
  const config = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 };

  try {
    const { data } = await apiClient.post(API_ROUTES.chat.upload, buildForm(), config);
    return data;
  } catch {
    // Retry once — first attempt can fail while Next.js dev compiles the route
    const { data } = await apiClient.post(API_ROUTES.chat.upload, buildForm(), config);
    return data;
  }
}
