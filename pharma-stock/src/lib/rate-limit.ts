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

export function createRateLimiter(options: { windowMs: number; max: number }) {
  return function check(key: string): boolean {
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

export function getClientIPFromHeaders(
  headers: Record<string, string | string[] | undefined> | undefined
): string {
  if (!headers) return "unknown";
  const xff = headers["x-forwarded-for"];
  if (xff) {
    const value = Array.isArray(xff) ? xff[0] : xff;
    return value.split(",")[0].trim();
  }
  const real = headers["x-real-ip"];
  if (real) return Array.isArray(real) ? real[0] : real;
  return "unknown";
}
