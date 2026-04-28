import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';

const VALID_CATEGORIES = ['drug', 'therapy', 'device'] as const;
const VALID_STAGES = ['research', 'clinical', 'approved'] as const;

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
    const url = new URL(req.url);
    const rawCategory = url.searchParams.get('category');
    const rawStage = url.searchParams.get('stage');

    const category = VALID_CATEGORIES.includes(rawCategory as typeof VALID_CATEGORIES[number])
      ? rawCategory
      : null;
    const stage = VALID_STAGES.includes(rawStage as typeof VALID_STAGES[number])
      ? rawStage
      : null;

    const conditions: string[] = [];
    const args: unknown[] = [];
    let argIdx = 1;

    if (category) {
      conditions.push(`category = $${argIdx++}`);
      args.push(category);
    }
    if (stage) {
      conditions.push(`stage = $${argIdx++}`);
      args.push(stage);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM breakthroughs ${where}`, args),
      pool.query(
        `SELECT id, title_en, title_ar, company, symbol, description_en, description_ar,
                potential_impact_en, potential_impact_ar, category, stage, created_at
         FROM breakthroughs ${where}
         ORDER BY created_at DESC
         LIMIT $${argIdx} OFFSET $${argIdx + 1}`,
        [...args, limit, offset]
      ),
    ]);

    const total: number = countResult.rows[0].total;

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (err) {
    console.error('[breakthroughs] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch breakthroughs' } },
      { status: 500 }
    );
  }
}
