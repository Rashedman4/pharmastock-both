import pool from '../db';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'admin' | 'user';
  senderId: number | null;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'file';
  content: string | null;
  attachmentUrl: string | null;
  attachmentMetadata: Record<string, unknown>;
  broadcastCampaignId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  adminUnreadCount: number;
  userUnreadCount: number;
  createdAt: string;
}

interface CreateMessageInput {
  conversationId: string;
  senderType: 'admin' | 'user';
  senderId: number | null;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'file';
  content?: string;
  attachmentUrl?: string;
  attachmentMetadata?: Record<string, unknown>;
  broadcastCampaignId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    messageType: row.message_type,
    content: row.content,
    attachmentUrl: row.attachment_url,
    attachmentMetadata: row.attachment_metadata ?? {},
    broadcastCampaignId: row.broadcast_campaign_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    adminUnreadCount: row.admin_unread_count,
    userUnreadCount: row.user_unread_count,
    createdAt: row.created_at,
  };
}

export const chatService = {
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    const existing = await pool.query(
      'SELECT * FROM chat_conversations WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length > 0) return rowToConversation(existing.rows[0]);

    const created = await pool.query(
      'INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return rowToConversation(created.rows[0]);
  },

  async getUserConversations(userId: number): Promise<Conversation[]> {
    const result = await pool.query(
      `SELECT * FROM chat_conversations
       WHERE user_id = $1
       ORDER BY COALESCE(last_message_at, created_at) DESC`,
      [userId]
    );
    return result.rows.map(rowToConversation);
  },

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit = 30,
    direction: 'before' | 'after' = 'before'
  ): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
    let rows;

    if (cursor) {
      const cursorRow = await pool.query(
        'SELECT created_at FROM chat_messages WHERE id = $1',
        [cursor]
      );
      if (!cursorRow.rows.length) return { messages: [], nextCursor: null };

      const cursorDate = cursorRow.rows[0].created_at;
      const op = direction === 'before' ? '<' : '>';
      const ord = direction === 'before' ? 'DESC' : 'ASC';

      const result = await pool.query(
        `SELECT * FROM chat_messages
         WHERE conversation_id = $1 AND created_at ${op} $2
         ORDER BY created_at ${ord}
         LIMIT $3`,
        [conversationId, cursorDate, limit + 1]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `SELECT * FROM chat_messages
         WHERE conversation_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [conversationId, limit + 1]
      );
      rows = result.rows;
    }

    const hasMore = rows.length > limit;
    const sliced = rows.slice(0, limit);
    // Return chronological (oldest first) so FlatList inverted renders newest at bottom
    const messages = [...sliced].reverse().map(rowToMessage);
    const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;

    return { messages, nextCursor };
  },

  async createMessage(input: CreateMessageInput): Promise<ChatMessage> {
    const result = await pool.query(
      `INSERT INTO chat_messages
         (conversation_id, sender_type, sender_id, message_type, content,
          attachment_url, attachment_metadata, broadcast_campaign_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        input.conversationId,
        input.senderType,
        input.senderId ?? null,
        input.messageType,
        input.content ?? null,
        input.attachmentUrl ?? null,
        JSON.stringify(input.attachmentMetadata ?? {}),
        input.broadcastCampaignId ?? null,
      ]
    );

    const preview = input.content
      ? input.content.slice(0, 100)
      : `[${input.messageType}]`;

    const unreadCol =
      input.senderType === 'user' ? 'admin_unread_count' : 'user_unread_count';

    await pool.query(
      `UPDATE chat_conversations
       SET last_message_at = NOW(),
           last_message_preview = $1,
           ${unreadCol} = ${unreadCol} + 1
       WHERE id = $2`,
      [preview, input.conversationId]
    );

    return rowToMessage(result.rows[0]);
  },

  async markMessageRead(messageId: string, userId: number): Promise<void> {
    const result = await pool.query(
      `UPDATE chat_messages SET read_at = NOW()
       WHERE id = $1
         AND read_at IS NULL
         AND conversation_id IN (
           SELECT id FROM chat_conversations WHERE user_id = $2
         )
       RETURNING conversation_id`,
      [messageId, userId]
    );

    if (result.rows.length > 0) {
      await pool.query(
        'UPDATE chat_conversations SET user_unread_count = 0 WHERE id = $1',
        [result.rows[0].conversation_id]
      );
    }
  },

  async getMessage(messageId: string): Promise<ChatMessage | null> {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE id = $1',
      [messageId]
    );
    return result.rows.length > 0 ? rowToMessage(result.rows[0]) : null;
  },

  async userOwnsConversation(userId: number, conversationId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    return result.rows.length > 0;
  },

  async resetUnreadCount(conversationId: string, target: 'user' | 'admin'): Promise<void> {
    const col = target === 'admin' ? 'admin_unread_count' : 'user_unread_count';
    await pool.query(
      `UPDATE chat_conversations SET ${col} = 0 WHERE id = $1`,
      [conversationId]
    );
  },
};
