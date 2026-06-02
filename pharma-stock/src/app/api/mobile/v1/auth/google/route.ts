import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenTTL,
  getRefreshTokenTTL,
} from '@/lib/mobile/jwt';
import { getClientIP } from '@/lib/mobile/rate-limit';

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string;
  error?: string;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  const data = await res.json() as GoogleTokenInfo;
  if (data.error || !data.sub) {
    throw new Error('Invalid Google ID token');
  }
  return data;
}

export async function POST(req: NextRequest) {
  let body: { idToken?: string; deviceId?: string; deviceName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const { idToken, deviceId, deviceName } = body;

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'idToken is required', fields: { idToken: 'required' } } },
      { status: 400 }
    );
  }

  let tokenInfo: GoogleTokenInfo;
  try {
    tokenInfo = await verifyGoogleIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_TOKEN', message: 'Google token verification failed' } },
      { status: 401 }
    );
  }

  // Verify aud matches our web client ID
  const webClientId = process.env.GOOGLE_CLIENT_ID;
  if (webClientId && tokenInfo.aud !== webClientId) {
    // Also allow iOS/Android client IDs registered in the same project
    // Google tokens from iOS/Android native sign-in use the platform client ID as aud
    const validAudiences = [
      webClientId,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean);

    if (!validAudiences.includes(tokenInfo.aud)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Token audience mismatch' } },
        { status: 401 }
      );
    }
  }

  if (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true as unknown as string) {
    return NextResponse.json(
      { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Google email is not verified' } },
      { status: 401 }
    );
  }

  const { sub: googleId, email, given_name, family_name, name } = tokenInfo;

  // Derive first/last name — split full name if individual parts missing
  let firstName = given_name ?? '';
  let lastName = family_name ?? '';
  if (!firstName && !lastName && name) {
    const parts = name.trim().split(/\s+/);
    firstName = parts[0] ?? '';
    lastName = parts.slice(1).join(' ') || firstName;
  }

  // 1. Find existing Google account
  let user = (
    await pool.query(
      `SELECT id, email, firstname, lastname, phonenumber, role, created_at
       FROM users WHERE provider = 'google' AND provider_id = $1`,
      [googleId]
    )
  ).rows[0] ?? null;

  if (!user) {
    // 2. Find existing email/password account → link it
    const emailUser = (
      await pool.query(
        `SELECT id, email, firstname, lastname, phonenumber, role, created_at
         FROM users WHERE email = $1`,
        [email]
      )
    ).rows[0] ?? null;

    if (emailUser) {
      // Link the Google account to the existing user
      await pool.query(
        `UPDATE users SET provider = 'google', provider_id = $1, provider_email = $2
         WHERE id = $3`,
        [googleId, email, emailUser.id]
      );
      user = emailUser;
    } else {
      // 3. Create a brand-new user
      user = (
        await pool.query(
          `INSERT INTO users
             (firstname, lastname, email, password, provider, provider_id, provider_email)
           VALUES ($1, $2, $3, 'oauth_placeholder', 'google', $4, $5)
           RETURNING id, email, firstname, lastname, phonenumber, role, created_at`,
          [firstName || null, lastName || null, email, googleId, email]
        )
      ).rows[0];
    }
  }

  const accessToken = generateAccessToken(user.id, user.email ?? email);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + getRefreshTokenTTL() * 1000);
  const ip = getClientIP(req);

  await pool.query(
    `INSERT INTO mobile_refresh_tokens
       (user_id, token_hash, device_id, device_name, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5::inet, $6)`,
    [
      user.id,
      tokenHash,
      deviceId ?? null,
      deviceName ?? null,
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
      name: [user.firstname, user.lastname].filter(Boolean).join(' ') || name || email,
      role: user.role,
      phonenumber: user.phonenumber,
      created_at: user.created_at,
    },
  });
}
