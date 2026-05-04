import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { chatService } from '@/lib/services/chat.service';
import { resolveAudienceUserIds } from '@/lib/services/audience.service';
import { sendPushToUser } from '@/lib/services/push.service';
import { getIO } from '@/lib/socket/socket-server';

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return null;
  const authorized = process.env.AUTHORIZED_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  if (!authorized.includes(token.email as string)) return null;
  return token;
}

type Ctx = { params: Promise<{ id: string }> };

// GET: message history for this group
export async function GET(req: NextRequest, ctx: Ctx) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: groupId } = await ctx.params;

  const result = await pool.query(
    `SELECT id, content, message_type, attachment_url, attachment_metadata,
            status, sent_at, recipient_count, created_at
     FROM broadcast_campaigns
     WHERE group_id = $1
     ORDER BY created_at ASC`,
    [groupId]
  );

  return NextResponse.json({ data: result.rows });
}

// POST: send a new message to this group's audience (create + send in one step)
export async function POST(req: NextRequest, ctx: Ctx) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: groupId } = await ctx.params;

  const groupRes = await pool.query('SELECT * FROM broadcast_groups WHERE id = $1', [groupId]);
  if (!groupRes.rows.length) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  const group = groupRes.rows[0];

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const {
    content,
    messageType = 'text',
    attachmentUrl,
    attachmentMetadata,
  } = body as {
    content?: string;
    messageType?: string;
    attachmentUrl?: string;
    attachmentMetadata?: Record<string, unknown>;
  };

  if (messageType === 'text' && !content?.trim()) {
    return NextResponse.json({ error: 'content is required for text messages' }, { status: 400 });
  }
  if (messageType !== 'text' && !attachmentUrl) {
    return NextResponse.json({ error: 'attachmentUrl is required for media messages' }, { status: 400 });
  }

  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [token.email]);
  if (!userRes.rows.length) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  const adminId = userRes.rows[0].id;

  // Create campaign record
  const campaignRes = await pool.query(
    `INSERT INTO broadcast_campaigns
       (admin_id, group_id, title, message_type, content, attachment_url, attachment_metadata,
        audience_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sending')
     RETURNING *`,
    [
      adminId,
      groupId,
      group.name,
      messageType,
      content?.trim() ?? null,
      attachmentUrl ?? null,
      JSON.stringify(attachmentMetadata ?? {}),
      group.audience_type,
    ]
  );
  const campaign = campaignRes.rows[0];

  const userIds = await resolveAudienceUserIds(
    group.audience_type,
    group.custom_user_ids?.length ? group.custom_user_ids : undefined
  );

  const io = getIO();
  let successCount = 0;

  // Build push body depending on message type
  const pushBody =
    messageType === 'text'
      ? (content?.trim() ?? '').slice(0, 80)
      : messageType === 'voice'
      ? '🎙️ Voice note'
      : '🖼️ Image';

  for (const userId of userIds) {
    try {
      const conv = await chatService.getOrCreateConversation(userId);

      const message = await chatService.createMessage({
        conversationId: conv.id,
        senderType: 'admin',
        senderId: null,
        messageType: messageType as 'text' | 'image' | 'voice' | 'video' | 'file',
        content: content?.trim(),
        attachmentUrl,
        attachmentMetadata,
        broadcastCampaignId: campaign.id,
      });

      if (io) io.to(`user:${userId}`).emit('new_message', message);

      await sendPushToUser(userId, {
        title: '💬 New message',
        body: pushBody,
        data: { type: 'chat_message', conversationId: conv.id, screen: 'chat' },
      }).catch(() => {});

      await pool.query(
        `INSERT INTO broadcast_recipients (campaign_id, user_id, delivered_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (campaign_id, user_id) DO UPDATE SET delivered_at = NOW()`,
        [campaign.id, userId]
      );

      successCount++;
    } catch {
      await pool.query(
        'INSERT INTO broadcast_recipients (campaign_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [campaign.id, userId]
      ).catch(() => {});
    }
  }

  await pool.query(
    `UPDATE broadcast_campaigns SET status = 'sent', sent_at = NOW(), recipient_count = $1 WHERE id = $2`,
    [successCount, campaign.id]
  );

  return NextResponse.json(
    { id: campaign.id, content: content?.trim() ?? null, messageType, attachmentUrl, sent_at: new Date().toISOString(), recipient_count: successCount },
    { status: 201 }
  );
}
