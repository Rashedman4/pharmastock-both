import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import { generateAccessToken, hashToken, getAccessTokenTTL } from '@/lib/mobile/jwt';
import { getUserById } from '@/lib/services/user.service';

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'refresh_token is required' } },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(parsed.data.refresh_token);

  const { rows } = await pool.query(
    `SELECT * FROM mobile_refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid, expired, or revoked refresh token',
        },
      },
      { status: 401 }
    );
  }

  const user = await getUserById(rows[0].user_id as number);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists' } },
      { status: 401 }
    );
  }

  const accessToken = generateAccessToken(user.id, user.email ?? '');

  return NextResponse.json({
    access_token: accessToken,
    expires_in: getAccessTokenTTL(),
  });
}
