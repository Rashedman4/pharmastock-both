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
    const signalId = parseInt(id, 10);

    if (isNaN(signalId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Invalid signal ID' } },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, symbol, type, enter_price, price_now, first_target, second_target,
              date_opened, reason_en, reason_ar
       FROM signals WHERE id = $1`,
      [signalId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Signal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[signals/:id] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch signal' } },
      { status: 500 }
    );
  }
}
