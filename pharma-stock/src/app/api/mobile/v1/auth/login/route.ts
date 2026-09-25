import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '@/lib/db';
import { getUserWithPasswordByEmail } from '@/lib/services/user.service';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenTTL,
  getRefreshTokenTTL,
} from '@/lib/mobile/jwt';
import { createRateLimiter, getClientIP, rateLimitResponse } from '@/lib/mobile/rate-limit';
import { recordLogin, requestAuthContext } from '@/lib/services/auth-log.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_id: z.string().optional(),
  device_name: z.string().optional(),
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: getClientIP,
});

export async function POST(req: NextRequest) {
  if (!loginLimiter(req)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach((e) => {
      if (e.path[0]) fields[String(e.path[0])] = e.message;
    });
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request', fields } },
      { status: 400 }
    );
  }

  const { email, password, device_id, device_name } = parsed.data;

  // Login tracking for the admin monitor page. recordLogin is fire-and-forget
  // and never throws, so none of these calls can fail the login.
  const logCtx = requestAuthContext(req);
  const logFailure = (reason: string, userId?: number | null) =>
    recordLogin({
      userId: userId ?? null,
      client: 'mobile',
      method: 'credentials',
      success: false,
      emailAttempted: email,
      failureReason: reason,
      ...logCtx,
    });

  const user = await getUserWithPasswordByEmail(email);

  if (!user) {
    logFailure('No user found with this email');
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } },
      { status: 401 }
    );
  }

  if (user.provider === 'google') {
    logFailure('Email registered with social login', user.id);
    return NextResponse.json(
      {
        error: {
          code: 'OAUTH_ACCOUNT',
          message: 'This account uses Google sign-in. Please use Google to log in.',
        },
      },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    logFailure('Invalid password', user.id);
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } },
      { status: 401 }
    );
  }

  const accessToken = generateAccessToken(user.id, user.email ?? email);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + getRefreshTokenTTL() * 1000);
  const ip = getClientIP(req);

  recordLogin({
    userId: user.id,
    client: 'mobile',
    method: 'credentials',
    success: true,
    emailAttempted: email,
    ...logCtx,
  });

  await pool.query(
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
}
