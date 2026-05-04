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

    // Verify plan belongs to this user
    const ownerCheck = await pool.query(
      `SELECT tp.id FROM trade_plans tp
       JOIN elite_portfolios_simple eps ON eps.id = tp.portfolio_id
       JOIN elite_members em ON em.id = eps.elite_member_id
       WHERE tp.id = $1 AND em.user_id = $2`,
      [planId, auth.userId]
    );

    if (!ownerCheck.rows[0]) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Trade plan not found' } },
        { status: 404 }
      );
    }

    const res = await pool.query(
      `SELECT tpm.id, tpm.trade_plan_id, tpm.sender_user_id, tpm.sender_role,
              tpm.message_text, tpm.created_at,
              u.firstname, u.lastname
       FROM trade_plan_messages tpm
       JOIN users u ON u.id = tpm.sender_user_id
       WHERE tpm.trade_plan_id = $1
       ORDER BY tpm.created_at ASC`,
      [planId]
    );

    return NextResponse.json({ data: res.rows });
  } catch (err) {
    console.error('[elite/trade-plans/[id]/messages] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } },
      { status: 500 }
    );
  }
}

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
    const messageText = String(body?.message_text || '').trim();

    if (!messageText) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'message_text is required', field: 'message_text' } },
        { status: 400 }
      );
    }

    const result = await service.addInvestorPlanMessage(auth.userId, Number(id), messageText);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('[elite/trade-plans/[id]/messages] POST error', err);
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: err?.message ?? 'Failed to send message' } },
      { status: 400 }
    );
  }
}
