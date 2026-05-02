import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { chatService } from '@/lib/services/chat.service';
import { resolveAudienceUserIds } from '@/lib/services/audience.service';
import { sendPushToUser } from '@/lib/services/push.service';
import { getIO } from '@/lib/socket/socket-server';
import { createRateLimiter, rateLimitResponse } from '@/lib/mobile/rate-limit';

const sendLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  keyFn: (req) => req.headers.get('authorization') ?? req.ip ?? 'admin',
});

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return null;
  const authorized = process.env.AUTHORIZED_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  if (!authorized.includes(token.email as string)) return null;
  return token;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!sendLimiter(req)) return rateLimitResponse();

  const { id: campaignId } = await ctx.params;

  const campaignRes = await pool.query(
    'SELECT * FROM broadcast_campaigns WHERE id = $1',
    [campaignId]
  );
  if (!campaignRes.rows.length) {
    return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
  }

  const campaign = campaignRes.rows[0];
  if (campaign.status === 'sent') {
    return NextResponse.json({ error: 'Broadcast already sent' }, { status: 409 });
  }

  // Mark as sending
  await pool.query(
    "UPDATE broadcast_campaigns SET status = 'sending' WHERE id = $1",
    [campaignId]
  );

  try {
    const userIds = await resolveAudienceUserIds(
      campaign.audience_type,
      campaign.custom_user_ids
    );

    const io = getIO();

    let successCount = 0;
    for (const userId of userIds) {
      try {
        // Get or create conversation for user
        const conv = await chatService.getOrCreateConversation(userId);

        // Create the message in this conversation
        const message = await chatService.createMessage({
          conversationId: conv.id,
          senderType: 'admin',
          senderId: null,
          messageType: campaign.message_type,
          content: campaign.content,
          attachmentUrl: campaign.attachment_url,
          attachmentMetadata: campaign.attachment_metadata,
          broadcastCampaignId: campaignId,
        });

        // Real-time delivery via Socket.IO
        if (io) {
          io.to(`user:${userId}`).emit('new_message', message);
        }

        // Push notification
        await sendPushToUser(userId, {
          title: '📢 New Message',
          body: campaign.content?.slice(0, 80) ?? `[${campaign.message_type}]`,
          data: { type: 'chat_message', conversationId: conv.id, screen: 'chat' },
        }).catch(() => {});

        // Record delivery
        await pool.query(
          `INSERT INTO broadcast_recipients (campaign_id, user_id, delivered_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (campaign_id, user_id) DO UPDATE SET delivered_at = NOW()`,
          [campaignId, userId]
        );

        successCount++;
      } catch {
        // Record without delivered_at
        await pool.query(
          `INSERT INTO broadcast_recipients (campaign_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (campaign_id, user_id) DO NOTHING`,
          [campaignId, userId]
        ).catch(() => {});
      }
    }

    await pool.query(
      `UPDATE broadcast_campaigns
       SET status = 'sent', sent_at = NOW(), recipient_count = $1
       WHERE id = $2`,
      [successCount, campaignId]
    );

    return NextResponse.json({ success: true, recipientCount: successCount });
  } catch (err) {
    await pool.query(
      "UPDATE broadcast_campaigns SET status = 'failed' WHERE id = $1",
      [campaignId]
    );
    console.error('[Broadcast] send failed:', err);
    return NextResponse.json({ error: 'Broadcast send failed' }, { status: 500 });
  }
}
