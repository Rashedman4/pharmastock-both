import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ProgramService } from '@/modules/program/program.service';

export const runtime = 'nodejs';

const service = new ProgramService();

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
    const planId = Number(id);

    // Verify plan belongs to this user's portfolio
    const res = await pool.query(
      `SELECT tp.*,
              eps.id AS portfolio_id,
              te.id AS execution_id,
              te.executed_quantity,
              te.executed_price,
              te.executed_at,
              te.screenshot_url,
              te.screenshot_name,
              te.investor_note AS execution_note,
              te.status AS execution_status,
              pps.id AS position_id,
              pps.quantity_open,
              pps.entry_price,
              pps.status AS position_status,
              pps.opened_at
       FROM trade_plans tp
       JOIN elite_portfolios_simple eps ON eps.id = tp.portfolio_id
       JOIN elite_members em ON em.id = eps.elite_member_id
       LEFT JOIN trade_executions te ON te.trade_plan_id = tp.id
       LEFT JOIN portfolio_positions_simple pps ON pps.trade_plan_id = tp.id
       WHERE tp.id = $1 AND em.user_id = $2`,
      [planId, auth.userId]
    );

    if (!res.rows[0]) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Trade plan not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('[elite/trade-plans/[id]] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trade plan' } },
      { status: 500 }
    );
  }
}

// Investor responds to a trade plan (ACCEPTED / REJECTED)
export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const decision = String(body?.decision || '').toUpperCase();
    const note = body?.note ? String(body.note).trim() : null;

    if (!['ACCEPTED', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'decision must be ACCEPTED or REJECTED', field: 'decision' } },
        { status: 400 }
      );
    }

    const result = await service.respondToTradePlan(auth.userId, Number(id), decision, note);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[elite/trade-plans/[id]] POST error', err);
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: err?.message ?? 'Failed to respond to trade plan' } },
      { status: 400 }
    );
  }
}
