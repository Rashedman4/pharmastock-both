import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { hashToken } from '@/lib/mobile/jwt';

const logoutSchema = z.object({
  refresh_token: z.string().optional(),
  device_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  let bodyData: { refresh_token?: string; device_id?: string } = {};
  try {
    const raw = await req.json();
    const parsed = logoutSchema.safeParse(raw);
    if (parsed.success) bodyData = parsed.data;
  } catch {
    // Body is optional on logout
  }

  if (bodyData.refresh_token) {
    const tokenHash = hashToken(bodyData.refresh_token);
    await pool.query(
      `UPDATE mobile_refresh_tokens SET revoked_at = NOW()
       WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [tokenHash, auth.userId]
    );
  }

  if (bodyData.device_id) {
    await pool.query(
      'DELETE FROM user_push_tokens WHERE user_id = $1 AND device_id = $2',
      [auth.userId, bodyData.device_id]
    );
  }

  return new NextResponse(null, { status: 204 });
}
