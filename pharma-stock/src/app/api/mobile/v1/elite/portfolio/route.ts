import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/modules/program/program.service';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import pool from '@/lib/db';

export const runtime = 'nodejs';

const service = new ProgramService();

/**
 * Repairs executions that were created with the old mobile route (status = 'SUBMITTED').
 * Those executions never created a portfolio position or deducted capital.
 * This runs transparently every time the portfolio is fetched and is idempotent.
 */
async function repairSubmittedExecutions(userId: number): Promise<void> {
  const portfolioRes = await pool.query(
    `SELECT eps.id AS portfolio_id, em.id AS member_id
     FROM elite_portfolios_simple eps
     JOIN elite_members em ON em.id = eps.elite_member_id
     WHERE em.user_id = $1
     LIMIT 1`,
    [userId]
  );
  if (!portfolioRes.rows[0]) return;

  const portfolioId: number = portfolioRes.rows[0].portfolio_id;
  const memberId: number = portfolioRes.rows[0].member_id;

  // Find executions that were saved with SUBMITTED status and have no position row
  const brokenRes = await pool.query(
    `SELECT te.id, te.trade_plan_id, te.executed_quantity, te.executed_price, te.executed_at,
            tp.symbol, tp.plan_side
     FROM trade_executions te
     JOIN trade_plans tp ON tp.id = te.trade_plan_id
     WHERE te.portfolio_id = $1
       AND te.status = 'SUBMITTED'
       AND NOT EXISTS (
         SELECT 1 FROM portfolio_positions_simple pps
         WHERE pps.trade_execution_id = te.id
       )`,
    [portfolioId]
  );

  if (!brokenRes.rows.length) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const exec of brokenRes.rows) {
      const grossCost = Number(exec.executed_quantity) * Number(exec.executed_price);

      await client.query(
        `UPDATE trade_executions SET status = 'OPENED', updated_at = NOW() WHERE id = $1`,
        [exec.id]
      );

      await client.query(
        `INSERT INTO portfolio_positions_simple
           (portfolio_id, trade_plan_id, trade_execution_id, symbol, side,
            quantity_open, entry_price, opened_at, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', NOW(), NOW())`,
        [
          portfolioId, exec.trade_plan_id, exec.id,
          exec.symbol, exec.plan_side,
          exec.executed_quantity, exec.executed_price, exec.executed_at,
        ]
      );

      await client.query(
        `UPDATE elite_portfolios_simple
         SET current_capital_amount = GREATEST(0, current_capital_amount - $2),
             updated_at = NOW()
         WHERE id = $1`,
        [portfolioId, grossCost]
      );
    }

    // Sync elite_members capital after all deductions
    const capitalRes = await client.query(
      `SELECT current_capital_amount FROM elite_portfolios_simple WHERE id = $1`,
      [portfolioId]
    );
    await client.query(
      `UPDATE elite_members
       SET current_capital_amount = $2, capital_updated_at = NOW()
       WHERE id = $1`,
      [memberId, capitalRes.rows[0].current_capital_amount]
    );

    await client.query('COMMIT');
    console.log(`[portfolio] repaired ${brokenRes.rows.length} submitted execution(s) for user ${userId}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[portfolio] repair error (non-fatal):', e);
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  try {
    // Auto-repair any executions that were saved without a position row
    await repairSubmittedExecutions(auth.userId);

    const portfolio = await service.getInvestorPortfolio(auth.userId);
    return NextResponse.json(portfolio);
  } catch (err: any) {
    console.error('[elite/portfolio] GET error', err);
    const msg: string = err?.message ?? '';
    if (msg.includes('not an elite') || msg.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_ELITE_MEMBER', message: 'You are not an active elite member' } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load portfolio' } },
      { status: 500 }
    );
  }
}
