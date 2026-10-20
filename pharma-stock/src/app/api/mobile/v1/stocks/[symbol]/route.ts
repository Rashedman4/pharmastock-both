import { NextRequest } from 'next/server';
import { apiHandler, ok, err } from '@/lib/mobile/api-handler';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { getStockDetail } from '@/modules/stocks/stocks.service';

/**
 * GET /api/mobile/v1/stocks/[symbol]
 *
 * The stock page: the stock, its cached price, the caller's watch state and
 * the latest 5 announcements / daily updates / breakthroughs / news. The price
 * is whatever is in `price_cache_simple` — this never calls the market-data
 * provider.
 */
const handler = apiHandler({
  GET: async (req: NextRequest, ctx) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    const { symbol } = await ctx.params;
    const stock = await getStockDetail(symbol, auth.userId);
    if (!stock) {
      return err('NOT_FOUND', `${symbol.toUpperCase()} is not a covered stock`, 404);
    }

    return ok(stock);
  },
});

export { handler as GET };
