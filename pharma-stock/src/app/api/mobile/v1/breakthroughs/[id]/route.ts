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
    const btId = parseInt(id, 10);

    if (isNaN(btId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Invalid breakthrough ID' } },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, title_en, title_ar, company, symbol, description_en, description_ar,
              potential_impact_en, potential_impact_ar, category, stage, created_at
       FROM breakthroughs WHERE id = $1`,
      [btId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Breakthrough not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[breakthroughs/:id] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch breakthrough' } },
      { status: 500 }
    );
  }
}
