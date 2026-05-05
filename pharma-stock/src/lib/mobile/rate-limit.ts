import { NextRequest, NextResponse } from 'next/server';

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Purge expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

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
