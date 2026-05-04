import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';

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
    const res = await pool.query(
      `SELECT id, account_name, bank_name, iban, swift_code, currency, country, instructions
       FROM firm_bank_accounts
       WHERE is_active = true
       ORDER BY updated_at DESC`
    );

    return NextResponse.json({ data: res.rows });
  } catch (err) {
    console.error('[elite/bank-accounts] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bank accounts' } },
      { status: 500 }
    );
  }
}
