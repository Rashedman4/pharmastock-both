import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { hashToken } from '@/lib/mobile/jwt';
import { createRateLimiter, getClientIP, rateLimitResponse } from '@/lib/mobile/rate-limit';

export const runtime = 'nodejs';

const handoffLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyFn: (req) => `handoff:${getMobileAuthPayload(req)?.userId ?? getClientIP(req)}`,
});

// Prefer the origin the phone actually used to reach this request (req.nextUrl.origin) —
// it just proved that host:port is reachable from the device. Falling back to server-side
// env vars alone breaks local dev, where they're typically "http://localhost:3000", which
// is not reachable from a physical device/emulator (localhost there means the device itself).
function getWebAppOrigin(req: NextRequest): string {
  return (
    req.nextUrl.origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    ''
  ).replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  if (!handoffLimiter(req)) {
    return rateLimitResponse();
  }

  try {
    const userResult = await pool.query(
      `SELECT preferred_language FROM users WHERE id = $1`,
      [auth.userId]
    );
    const lang = userResult.rows[0]?.preferred_language === 'ar' ? 'ar' : 'en';
    const redirectPath = `/${lang}/elite-group/portfolio`;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    await pool.query(
      `INSERT INTO mobile_web_handoff_tokens
         (user_id, token_hash, redirect_path, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 minutes')`,
      [auth.userId, tokenHash, redirectPath, getClientIP(req)]
    );

    const url = `${getWebAppOrigin(req)}/handoff?token=${rawToken}`;

    return NextResponse.json({ url, expires_in: 1800 });
  } catch (err) {
    console.error('[elite/payment-handoff] POST error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create handoff link' } },
      { status: 500 }
    );
  }
}
