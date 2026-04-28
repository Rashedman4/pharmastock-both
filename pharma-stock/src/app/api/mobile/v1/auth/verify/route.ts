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
import { getClientIP } from '@/lib/mobile/rate-limit';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
  device_id: z.string().optional(),
  device_name: z.string().optional(),
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

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'email and code are required' } },
      { status: 400 }
    );
  }

  const { email, code, device_id, device_name } = parsed.data;

  const client = await pool.connect();
  try {
    const pendingResult = await client.query(
      'SELECT * FROM pendingusers WHERE email = $1 AND verification_code = $2',
      [email, code]
    );

    if (pendingResult.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Invalid verification code or email' } },
        { status: 400 }
      );
    }

    const pending = pendingResult.rows[0];

    const insertResult = await client.query(
      `INSERT INTO users (firstname, lastname, email, password, phonenumber)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, firstname, lastname, phonenumber, role, created_at`,
      [
        pending.firstname,
        pending.lastname,
        pending.email,
        pending.password,
        pending.phonenumber ?? null,
      ]
    );

    const user = insertResult.rows[0];

    await client.query('DELETE FROM pendingusers WHERE email = $1', [email]);

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + getRefreshTokenTTL() * 1000);
    const ip = getClientIP(req);

    await client.query(
      `INSERT INTO mobile_refresh_tokens (user_id, token_hash, device_id, device_name, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5::inet, $6)`,
      [
        user.id,
        tokenHash,
        device_id ?? null,
        device_name ?? null,
        ip === 'unknown' ? null : ip,
        expiresAt,
      ]
    );

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: getAccessTokenTTL(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        name: [user.firstname, user.lastname].filter(Boolean).join(' '),
        role: user.role,
        phonenumber: user.phonenumber,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('[mobile/verify]', err);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Registration could not be completed. Please try again.',
        },
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
