import { NextRequest } from 'next/server';
import { apiHandler, ok, err } from '@/lib/mobile/api-handler';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import {
  addToWatchlist,
  getWatchlist,
  WATCHLIST_MAX_SYMBOLS,
} from '@/modules/stocks/stocks.service';

/**
 * GET  /api/mobile/v1/watchlist        — the user's watched stocks
 * POST /api/mobile/v1/watchlist        — { symbol } adds one (max 50)
 */
const handler = apiHandler({
  GET: async (req: NextRequest) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    return ok({ data: await getWatchlist(auth.userId) });
  },

  POST: async (req: NextRequest) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    const body = (await req.json().catch(() => null)) as { symbol?: unknown } | null;
    const symbol = typeof body?.symbol === 'string' ? body.symbol : '';
    if (!symbol.trim()) {
      return err('VALIDATION_ERROR', 'A `symbol` is required', 400, 'symbol');
    }

    const result = await addToWatchlist(auth.userId, symbol);

    switch (result.status) {
      case 'limit_reached':
        return err(
          'WATCHLIST_LIMIT',
          `Your watchlist is full (${WATCHLIST_MAX_SYMBOLS} stocks). Remove one to add another.`,
          400,
          'symbol'
        );
      case 'unknown_symbol':
        return err(
          'NOT_FOUND',
          `${symbol.trim().toUpperCase()} is not a covered stock`,
          404,
          'symbol'
        );
      default:
        // `already_watched` is success too: the end state is what was asked for.
        return ok({ data: await getWatchlist(auth.userId) }, 201);
    }
  },
});

export { handler as GET, handler as POST };
