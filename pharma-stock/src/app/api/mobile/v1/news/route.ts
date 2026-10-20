import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  try {
    const { page, limit, offset } = parsePaginationParams(req);

    // Optional symbol filter, matching the web news page's behaviour: a
    // partial, case-insensitive match so "MR" finds MRNA.
    const rawSymbol = (new URL(req.url).searchParams.get('symbol') ?? '').trim();
    // The wildcards are escaped so a typed "%" searches for a literal "%".
    const symbol = rawSymbol
      ? `%${rawSymbol.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
      : null;
    const where = symbol ? `WHERE symbol ILIKE $1 ESCAPE '\\'` : '';
    const params: (string | number)[] = symbol ? [symbol] : [];

    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM news ${where}`, params),
      pool.query(
        `SELECT id, title_en, title_ar, price, symbol, published_date
         FROM news
         ${where}
         ORDER BY published_date DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    const total: number = countResult.rows[0].total;

    return NextResponse.json(
      { data: dataResult.rows, pagination: buildPaginationMeta(total, page, limit) },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    );
  } catch (err) {
    console.error('[news] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch news' } },
      { status: 500 }
    );
  }
}
