import { NextRequest } from 'next/server';
import { apiHandler, ok, err } from '@/lib/mobile/api-handler';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { createRateLimiter, getClientIP, rateLimitResponse } from '@/lib/mobile/rate-limit';
import { searchStocks } from '@/modules/stocks/stocks.service';

/**
 * GET /api/mobile/v1/stocks/search?q=
 *
 * Searches the covered universe only (`stocks`), so an uncovered ticker simply
 * has no result — the app says so in a note under the input.
 */

// The screen debounces at 250ms; this is the backstop for a stuck keyboard.
const limiter = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  keyFn: (req) => `stocks-search:${getClientIP(req)}`,
});

const handler = apiHandler({
  GET: async (req: NextRequest) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);
    if (!limiter(req)) return rateLimitResponse();

    const q = new URL(req.url).searchParams.get('q') ?? '';
    return ok({ data: await searchStocks(q) });
  },
});

export { handler as GET };
