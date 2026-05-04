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
    const [appRes, memberRes] = await Promise.all([
      pool.query(
        `SELECT status, admin_response, admin_note, created_at
         FROM elite_applications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [auth.userId]
      ),
      pool.query(
        `SELECT status, approved_at, current_capital_amount, is_active
         FROM elite_members
         WHERE user_id = $1
         LIMIT 1`,
        [auth.userId]
      ),
    ]);

    const app = appRes.rows[0] ?? null;
    const member = memberRes.rows[0] ?? null;

    return NextResponse.json({
      has_application: !!app,
      application_status: app?.status ?? null,
      application_date: app?.created_at ?? null,
      admin_response: app?.admin_response ?? app?.admin_note ?? null,
      is_elite_member: !!member,
      elite_status: member?.status ?? null,
      approved_at: member?.approved_at ?? null,
      current_capital_amount: member?.current_capital_amount ?? null,
    });
  } catch (err) {
    console.error('[elite/status] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load elite status' } },
      { status: 500 }
    );
  }
}
