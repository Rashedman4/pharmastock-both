import { NextRequest } from 'next/server';
import { apiHandler, ok, err } from '@/lib/mobile/api-handler';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { removeFromWatchlist, setWatchAlerts } from '@/modules/stocks/stocks.service';

/**
 * DELETE /api/mobile/v1/watchlist/[symbol]  — unwatch
 * PATCH  /api/mobile/v1/watchlist/[symbol]  — { alerts_enabled: boolean }
 */
const handler = apiHandler({
  DELETE: async (req: NextRequest, ctx) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    const { symbol } = await ctx.params;
    const removed = await removeFromWatchlist(auth.userId, symbol);
    if (!removed) {
      return err('NOT_FOUND', `${symbol.toUpperCase()} is not on your watchlist`, 404);
    }

    return ok({ symbol: symbol.toUpperCase(), watched: false });
  },

  PATCH: async (req: NextRequest, ctx) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    const { symbol } = await ctx.params;
    const body = (await req.json().catch(() => null)) as {
      alerts_enabled?: unknown;
    } | null;

    if (typeof body?.alerts_enabled !== 'boolean') {
      return err(
        'VALIDATION_ERROR',
        '`alerts_enabled` must be true or false',
        400,
        'alerts_enabled'
      );
    }

    const updated = await setWatchAlerts(auth.userId, symbol, body.alerts_enabled);
    if (!updated) {
      return err('NOT_FOUND', `${symbol.toUpperCase()} is not on your watchlist`, 404);
    }

    return ok({ symbol: symbol.toUpperCase(), alerts_enabled: body.alerts_enabled });
  },
});

export { handler as DELETE, handler as PATCH };
