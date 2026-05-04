import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

export const runtime = 'nodejs';

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
      pool.query(
        `SELECT COUNT(*)::int AS total FROM firm_profit_payments WHERE investor_user_id = $1`,
        [auth.userId]
      ),
      pool.query(
        `SELECT fpp.*,
                fba.bank_name, fba.iban, fba.account_name, fba.swift_code, fba.instructions
         FROM firm_profit_payments fpp
         LEFT JOIN firm_bank_accounts fba ON fba.id = fpp.bank_account_id
         WHERE fpp.investor_user_id = $1
         ORDER BY fpp.created_at DESC
         LIMIT $2 OFFSET $3`,
        [auth.userId, limit, offset]
      ),
    ]);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(countResult.rows[0].total, page, limit),
    });
  } catch (err) {
    console.error('[elite/firm-profit-payments] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments' } },
      { status: 500 }
    );
  }
}
