import { NextRequest, NextResponse } from 'next/server';

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyFn: (req: NextRequest) => string;
}) {
  return function check(req: NextRequest): boolean {
    const key = options.keyFn(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    if (entry.count >= options.max) return false;

    entry.count++;
    return true;
  };
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
    { status: 429 }
  );
}
