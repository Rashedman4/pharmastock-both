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
    const updateId = parseInt(id, 10);

    if (isNaN(updateId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Invalid daily update ID' } },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, symbol, subtitle_en, subtitle_ar, description_en, description_ar, published_date
       FROM daily_updates WHERE id = $1`,
      [updateId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Daily update not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[daily-updates/:id] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch daily update' } },
      { status: 500 }
    );
  }
}
