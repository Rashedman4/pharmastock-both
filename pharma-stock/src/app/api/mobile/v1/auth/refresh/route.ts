import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenTTL,
  getRefreshTokenTTL,
} from '@/lib/mobile/jwt';
import { getUserById } from '@/lib/services/user.service';

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

const INVALID_REFRESH_RESPONSE = NextResponse.json(
  {
    error: {
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid, expired, or revoked refresh token',
    },
  },
  { status: 401 }
);

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

  // Look up the token without filtering on revoked/expired yet, so a
  // *revoked* token being presented again (rotation reuse — a signal the
  // token was copied/stolen) can be distinguished from one that's simply
  // unknown or has naturally expired.
  const { rows } = await pool.query(
    `SELECT * FROM mobile_refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  const existing = rows[0];

  if (!existing) {
    return INVALID_REFRESH_RESPONSE;
  }

  if (existing.revoked_at) {
    // This exact token was already rotated away (or explicitly revoked) —
    // presenting it again means a copy of an old token is in play. Treat as
    // a compromise signal and kill every active session for this user so a
    // stolen token can't keep being refreshed from wherever it leaked to.
    await pool.query(
      `UPDATE mobile_refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [existing.user_id]
    );
    return INVALID_REFRESH_RESPONSE;
  }

  if (new Date(existing.expires_at).getTime() <= Date.now()) {
    return INVALID_REFRESH_RESPONSE;
  }

  const user = await getUserById(existing.user_id as number);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists' } },
      { status: 401 }
    );
  }

  // Rotate: issue a brand-new refresh token and retire this one, in the same
  // transaction, preserving the original device metadata.
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + getRefreshTokenTTL() * 1000);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE mobile_refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [existing.id]
    );
    await client.query(
      `INSERT INTO mobile_refresh_tokens (user_id, token_hash, device_id, device_name, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        existing.user_id,
        newTokenHash,
        existing.device_id,
        existing.device_name,
        existing.ip_address,
        newExpiresAt,
      ]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const accessToken = generateAccessToken(user.id, user.email ?? '');

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: newRefreshToken,
    expires_in: getAccessTokenTTL(),
  });
}
