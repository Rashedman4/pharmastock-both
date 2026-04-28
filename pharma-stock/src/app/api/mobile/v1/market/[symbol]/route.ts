import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    const { rows } = await pool.query(
      `SELECT symbol, current_price, previous_close_price, change_amount,
              change_percent, currency, market_status, fetched_at
       FROM price_cache_simple WHERE symbol = $1`,
      [upperSymbol]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `No price data for ${upperSymbol}` } },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[market/:symbol] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch market price' } },
      { status: 500 }
    );
  }
}
