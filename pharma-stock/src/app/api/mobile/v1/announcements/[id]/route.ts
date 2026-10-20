import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { apiHandler, ok, err } from '@/lib/mobile/api-handler';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';

/** GET /api/mobile/v1/announcements/[id] — full bilingual Markdown. */
const handler = apiHandler({
  GET: async (req: NextRequest, ctx) => {
    const auth = getMobileAuthPayload(req);
    if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

    const { id } = await ctx.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return err('VALIDATION_ERROR', 'Announcement id must be a positive integer', 400);
    }

    const { rows } = await pool.query(
      `SELECT ca.id, ca.symbol, ca.title_en, ca.title_ar, ca.content_en, ca.content_ar,
              ca.source_url, ca.announced_at, ca.published_date,
              s.name_en AS stock_name_en, s.name_ar AS stock_name_ar
       FROM company_announcements ca
       LEFT JOIN stocks s ON s.symbol = ca.symbol
       WHERE ca.id = $1`,
      [numericId]
    );

    if (!rows.length) {
      return err('NOT_FOUND', 'Announcement not found', 404);
    }

    return ok(rows[0]);
  },
});

export { handler as GET };
