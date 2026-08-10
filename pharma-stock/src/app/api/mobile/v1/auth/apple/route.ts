import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenTTL,
  getRefreshTokenTTL,
} from '@/lib/mobile/jwt';
import { getClientIP } from '@/lib/mobile/rate-limit';
import { exchangeAppleAuthorizationCode } from '@/lib/mobile/appleTokens';
import { encryptAppleToken } from '@/lib/mobile/appleTokenCrypto';

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';
const KEYS_CACHE_TTL_MS = 60 * 60 * 1000;

interface AppleJWK {
  kty: string;
  kid: string;
  n: string;
  e: string;
}

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  sub: string;
  email?: string;
}

let cachedKeys: { keys: AppleJWK[]; fetchedAt: number } | null = null;

async function fetchApplePublicKeys(): Promise<AppleJWK[]> {
  const res = await fetch(APPLE_KEYS_URL);
  const data = (await res.json()) as { keys: AppleJWK[] };
  cachedKeys = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

async function getApplePublicKeys(): Promise<AppleJWK[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < KEYS_CACHE_TTL_MS) {
    return cachedKeys.keys;
  }
  return fetchApplePublicKeys();
}

function base64urlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

async function verifyAppleIdentityToken(identityToken: string): Promise<AppleTokenPayload> {
  const parts = identityToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed identity token');
  const [headerB64, payloadB64, sigB64] = parts;

  const header = JSON.parse(base64urlDecode(headerB64).toString('utf8')) as { kid: string };
  const payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8')) as AppleTokenPayload;

  let keys = await getApplePublicKeys();
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // Apple rotates keys; refetch once in case our cache is stale
    keys = await fetchApplePublicKeys();
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error('Apple signing key not found');

  const publicKey = crypto.createPublicKey({
    key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
    format: 'jwk',
  });
  const verified = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${headerB64}.${payloadB64}`),
    publicKey,
    base64urlDecode(sigB64)
  );
  if (!verified) throw new Error('Invalid Apple token signature');

  if (payload.iss !== APPLE_ISSUER) throw new Error('Invalid issuer');
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');

  const bundleId = process.env.APPLE_BUNDLE_ID;
  if (bundleId && payload.aud !== bundleId) throw new Error('Token audience mismatch');

  return payload;
}

export async function POST(req: NextRequest) {
  let body: {
    identityToken?: string;
    authorizationCode?: string;
    fullName?: { firstName?: string | null; lastName?: string | null } | null;
    deviceId?: string;
    deviceName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const { identityToken, authorizationCode, fullName, deviceId, deviceName } = body;

  if (!identityToken || typeof identityToken !== 'string') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'identityToken is required', fields: { identityToken: 'required' } } },
      { status: 400 }
    );
  }

  let payload: AppleTokenPayload;
  try {
    payload = await verifyAppleIdentityToken(identityToken);
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_TOKEN', message: 'Apple token verification failed' } },
      { status: 401 }
    );
  }

  const { sub: appleId, email } = payload;
  const firstName = fullName?.firstName ?? '';
  const lastName = fullName?.lastName ?? '';

  // 1. Find existing Apple account
  let user = (
    await pool.query(
      `SELECT id, email, firstname, lastname, phonenumber, role, created_at
       FROM users WHERE provider = 'apple' AND provider_id = $1`,
      [appleId]
    )
  ).rows[0] ?? null;

  if (!user) {
    // 2. Find existing email/password account → link it (Apple only sends email on first authorization)
    const emailUser = email
      ? ((
          await pool.query(
            `SELECT id, email, firstname, lastname, phonenumber, role, created_at
             FROM users WHERE email = $1`,
            [email]
          )
        ).rows[0] ?? null)
      : null;

    if (emailUser) {
      await pool.query(
        `UPDATE users SET provider = 'apple', provider_id = $1, provider_email = $2
         WHERE id = $3`,
        [appleId, email, emailUser.id]
      );
      user = emailUser;
    } else {
      if (!email) {
        return NextResponse.json(
          { error: { code: 'EMAIL_REQUIRED', message: 'No email available to create an account for this Apple ID' } },
          { status: 401 }
        );
      }
      // 3. Create a brand-new user
      user = (
        await pool.query(
          `INSERT INTO users
             (firstname, lastname, email, password, provider, provider_id, provider_email)
           VALUES ($1, $2, $3, 'oauth_placeholder', 'apple', $4, $5)
           RETURNING id, email, firstname, lastname, phonenumber, role, created_at`,
          [firstName || null, lastName || null, email, appleId, email]
        )
      ).rows[0];
    }
  }

  // Best-effort: exchange the one-time authorizationCode for a refresh_token
  // and store it (encrypted) so we can revoke the Apple association later if
  // this user deletes their account. Never blocks login on failure.
  if (authorizationCode) {
    const appleRefreshToken = await exchangeAppleAuthorizationCode(authorizationCode);
    if (appleRefreshToken) {
      await pool.query('UPDATE users SET apple_refresh_token_enc = $1 WHERE id = $2', [
        encryptAppleToken(appleRefreshToken),
        user.id,
      ]);
    }
  }

  const accessToken = generateAccessToken(user.id, user.email ?? email ?? '');
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
      name: [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email,
      role: user.role,
      phonenumber: user.phonenumber,
      created_at: user.created_at,
    },
  });
}
