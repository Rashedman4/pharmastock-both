import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { err } from '@/lib/mobile/api-handler';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';
import { ProgramService } from '@/modules/program/program.service';

export const runtime = 'nodejs';

const programService = new ProgramService();

const MAGIC: Array<{ bytes: number[]; ext: string; mime: string }> = [
  { bytes: [0xFF, 0xD8, 0xFF],       ext: 'jpg',  mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4E, 0x47], ext: 'png',  mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], ext: 'webp', mime: 'image/webp' },
];

function detectMime(buf: Uint8Array): { ext: string; mime: string } | null {
  for (const sig of MAGIC) {
    if (sig.bytes.every((b, i) => buf[i] === b)) return { ext: sig.ext, mime: sig.mime };
  }
  return null;
}

function signCloudinaryParams(p: Record<string, string>, secret: string): string {
  const base = Object.keys(p).sort().map((k) => `${k}=${p[k]}`).join('&');
  return crypto.createHash('sha1').update(`${base}${secret}`).digest('hex');
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

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM trade_executions WHERE portfolio_id = $1`,
        [portfolioId]
      ),
      pool.query(
        `SELECT te.*,
                tp.symbol, tp.company_name, tp.plan_side,
                tp.target_price_1, tp.target_price_2, tp.stop_loss_price
         FROM trade_executions te
         JOIN trade_plans tp ON tp.id = te.trade_plan_id
         WHERE te.portfolio_id = $1
         ORDER BY te.executed_at DESC
         LIMIT $2 OFFSET $3`,
        [portfolioId, limit, offset]
      ),
    ]);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(countResult.rows[0].total, page, limit),
    });
  } catch (e) {
    console.error('[elite/executions] GET error', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch executions' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err('BAD_REQUEST', 'Invalid multipart form data', 400);
    }

    const planId = Number(formData.get('plan_id'));
    const executedQuantity = Number(formData.get('executed_quantity'));
    const executedPrice = Number(formData.get('executed_price'));
    const executedAtRaw = formData.get('executed_at');
    const executedAt = executedAtRaw ? String(executedAtRaw) : new Date().toISOString();
    const investorNote = formData.get('investor_note')
      ? String(formData.get('investor_note')).trim()
      : null;
    const screenshotFile = formData.get('screenshot');

    if (!planId || isNaN(planId)) return err('VALIDATION_ERROR', 'plan_id is required', 400);
    if (!executedQuantity || executedQuantity <= 0) return err('VALIDATION_ERROR', 'executed_quantity must be > 0', 400);
    if (!executedPrice || executedPrice <= 0) return err('VALIDATION_ERROR', 'executed_price must be > 0', 400);

    // Verify investor's portfolio
    const portfolioRes = await pool.query(
      `SELECT eps.id AS portfolio_id
       FROM elite_portfolios_simple eps
       JOIN elite_members em ON em.id = eps.elite_member_id
       WHERE em.user_id = $1 LIMIT 1`,
      [auth.userId]
    );
    if (!portfolioRes.rows[0]) return err('NOT_ELITE_MEMBER', 'Not an active elite member', 403);
    const portfolioId = portfolioRes.rows[0].portfolio_id;

    // Verify plan belongs to this portfolio and is accepted
    const planRes = await pool.query(
      `SELECT id, status, investor_decision FROM trade_plans
       WHERE id = $1 AND portfolio_id = $2`,
      [planId, portfolioId]
    );
    if (!planRes.rows[0]) return err('NOT_FOUND', 'Trade plan not found', 404);

    const plan = planRes.rows[0];
    if (plan.status !== 'ACCEPTED_BY_INVESTOR') {
      return err('VALIDATION_ERROR', 'Plan must be in ACCEPTED_BY_INVESTOR status', 400);
    }

    // Check no existing execution
    const existingExec = await pool.query(
      `SELECT id FROM trade_executions WHERE trade_plan_id = $1 LIMIT 1`,
      [planId]
    );
    if (existingExec.rows[0]) {
      return err('CONFLICT', 'Execution already submitted for this plan', 409);
    }

    // Upload screenshot if provided
    let screenshotUrl: string | null = null;
    let screenshotName: string | null = null;

    if (screenshotFile instanceof File) {
      const buffer = Buffer.from(await screenshotFile.arrayBuffer());
      if (buffer.byteLength > 10 * 1024 * 1024) return err('FILE_TOO_LARGE', 'File must be under 10MB', 400);

      const detected = detectMime(new Uint8Array(buffer));
      if (!detected) return err('INVALID_FILE', 'Only JPG, PNG, or WebP images are allowed', 400);

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) return err('SERVER_ERROR', 'Storage not configured', 500);

      const timestamp = Math.floor(Date.now() / 1000);
      const folder = `elite-evidence/${auth.userId}`;
      const publicId = crypto.randomUUID();
      const signedParams = { folder, public_id: publicId, timestamp: String(timestamp) };
      const signature = signCloudinaryParams(signedParams, apiSecret);

      const upstream = new FormData();
      upstream.append('file', new Blob([buffer], { type: detected.mime }), `${publicId}.${detected.ext}`);
      upstream.append('api_key', apiKey);
      upstream.append('timestamp', String(timestamp));
      upstream.append('folder', folder);
      upstream.append('public_id', publicId);
      upstream.append('signature', signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: upstream }
      );
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) return err('UPLOAD_FAILED', uploadJson?.error?.message ?? 'Upload failed', 500);

      screenshotUrl = uploadJson.secure_url;
      screenshotName = screenshotFile.name;
    }

    // Delegate the actual money-moving transaction (capital lock/check, execution +
    // position insert, capital deduction, member capital sync, marking the plan
    // EXECUTED) to the same service method web uses, instead of a second hand-written
    // copy of that logic.
    try {
      const submitResult = await programService.submitTradeExecution(auth.userId, planId, {
        executedQuantity,
        executedPrice,
        executedAt,
        screenshotUrl,
        screenshotName,
        investorNote,
      });

      // Mobile's client expects the full execution row back (unlike web, which only
      // needs { executionId, currentCapitalAmount }), so re-fetch it by id.
      const { rows } = await pool.query(
        `SELECT * FROM trade_executions WHERE id = $1`,
        [submitResult.executionId]
      );

      return NextResponse.json(rows[0], { status: 201 });
    } catch (e: any) {
      console.error('[elite/executions] submit execution error', e);
      const msg: string = e?.message ?? 'Failed to submit execution';
      if (msg.includes('Not enough free capital') || msg.includes('negative')) {
        return err('INSUFFICIENT_CAPITAL', msg, 400);
      }
      if (msg.includes('already submitted')) {
        return err('CONFLICT', msg, 409);
      }
      if (msg.includes('not found')) {
        return err('NOT_FOUND', msg, 404);
      }
      return err('VALIDATION_ERROR', msg, 400);
    }
  } catch (e) {
    console.error('[elite/executions] POST error', e);
    return err('INTERNAL_ERROR', 'Failed to submit execution', 500);
  }
}
