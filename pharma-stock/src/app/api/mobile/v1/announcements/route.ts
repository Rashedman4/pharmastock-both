import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { apiHandler, ok, err } from '@/lib/mobile/api-handler';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';
import { normalizeSymbol } from '@/modules/stocks/stocks.service';

/**
 * GET /api/mobile/v1/announcements?symbol=&page=&limit=
 *
 * The list only carries the titles — `content_*` is Markdown and can be long,
 * so the detail route fetches it per announcement.
 */
const handler = apiHandler({
  GET: async (req: NextRequest) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    const { page, limit, offset } = parsePaginationParams(req);
    const rawSymbol = new URL(req.url).searchParams.get('symbol');
    const symbol = rawSymbol ? normalizeSymbol(rawSymbol) : null;

    const where = symbol ? 'WHERE symbol = $1' : '';
    const params = symbol ? [symbol] : [];

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM company_announcements ${where}`,
        params
      ),
      pool.query(
        `SELECT id, symbol, title_en, title_ar, source_url, announced_at, published_date
         FROM company_announcements ${where}
         ORDER BY published_date DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    return ok({
      data: dataResult.rows,
      pagination: buildPaginationMeta(countResult.rows[0].total, page, limit),
    });
  },
});

export { handler as GET };
