import crypto from 'crypto';

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function parseTTL(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900;
  const num = parseInt(match[1], 10);
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return num * (units[match[2]] ?? 60);
}

export function generateAccessToken(userId: number, email: string): string {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) throw new Error('MOBILE_JWT_SECRET is not configured');

  const header = base64urlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const ttl = parseTTL(process.env.ACCESS_TOKEN_TTL ?? '15m');
  const payload = base64urlEncode(
    Buffer.from(JSON.stringify({ userId, email, iat: now, exp: now + ttl }))
  );
  const sig = base64urlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${sig}`;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): { userId: number; email: string } | null {
  try {
    const secret = process.env.MOBILE_JWT_SECRET;
    if (!secret) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = base64urlEncode(
      crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest()
    );

    const sigBuf = Buffer.from(signature, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { userId: number; email: string; exp: number };

    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

export function getAccessTokenTTL(): number {
  return parseTTL(process.env.ACCESS_TOKEN_TTL ?? '15m');
}

export function getRefreshTokenTTL(): number {
  return parseTTL(process.env.REFRESH_TOKEN_TTL ?? '30d');
}
