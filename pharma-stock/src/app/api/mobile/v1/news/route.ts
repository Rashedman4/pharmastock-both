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

    const [countResult, dataResult] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM news'),
      pool.query(
        `SELECT id, title_en, title_ar, price, symbol, published_date
         FROM news
         ORDER BY published_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    const total: number = countResult.rows[0].total;

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (err) {
    console.error('[news] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch news' } },
      { status: 500 }
    );
  }
}
