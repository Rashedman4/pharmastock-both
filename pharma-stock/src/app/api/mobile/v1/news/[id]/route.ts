import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const newsId = parseInt(id, 10);

    if (isNaN(newsId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Invalid news ID' } },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, title_en, title_ar, price, symbol, published_date
       FROM news WHERE id = $1`,
      [newsId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'News item not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[news/:id] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch news item' } },
      { status: 500 }
    );
  }
}
