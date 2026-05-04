import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set([
  'DRAFT', 'SENT', 'REJECTED_BY_INVESTOR', 'ACCEPTED_BY_INVESTOR',
  'EXECUTED', 'CANCELLED', 'CLOSED',
]);

export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  try {
    // Get user's portfolio
    const portfolioRes = await pool.query(
      `SELECT eps.id AS portfolio_id
       FROM elite_portfolios_simple eps
       JOIN elite_members em ON em.id = eps.elite_member_id
       WHERE em.user_id = $1
       LIMIT 1`,
      [auth.userId]
    );

    if (!portfolioRes.rows[0]) {
      return NextResponse.json(
        { error: { code: 'NOT_ELITE_MEMBER', message: 'You are not an active elite member' } },
        { status: 403 }
      );
    }

    const portfolioId = portfolioRes.rows[0].portfolio_id;
    const { page, limit, offset } = parsePaginationParams(req);

    const statusFilter = req.nextUrl.searchParams.get('status');
    const useStatusFilter = statusFilter && VALID_STATUSES.has(statusFilter.toUpperCase());

    const whereClause = useStatusFilter
      ? `WHERE tp.portfolio_id = $1 AND tp.status = $4`
      : `WHERE tp.portfolio_id = $1`;

    const countParams = useStatusFilter ? [portfolioId, statusFilter!.toUpperCase()] : [portfolioId];
    const dataParams  = useStatusFilter
      ? [portfolioId, limit, offset, statusFilter!.toUpperCase()]
      : [portfolioId, limit, offset];

    const countQuery = `
      SELECT COUNT(*)::int AS total FROM trade_plans tp
      ${useStatusFilter ? 'WHERE tp.portfolio_id = $1 AND tp.status = $2' : 'WHERE tp.portfolio_id = $1'}
    `;

    const dataQuery = `
      SELECT tp.*,
             te.id AS execution_id,
             te.executed_quantity,
             te.executed_price,
             te.executed_at,
             te.status AS execution_status
      FROM trade_plans tp
      LEFT JOIN trade_executions te ON te.trade_plan_id = tp.id
      ${whereClause}
      ORDER BY tp.planned_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams),
    ]);

    const total: number = countResult.rows[0].total;

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (err) {
    console.error('[elite/trade-plans] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trade plans' } },
      { status: 500 }
    );
  }
}
