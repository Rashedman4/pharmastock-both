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
        `SELECT COUNT(*)::int AS total
         FROM position_close_requests pcr
         JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
         WHERE pps.portfolio_id = $1`,
        [portfolioId]
      ),
      pool.query(
        `SELECT pcr.*,
                pps.symbol, pps.side, pps.quantity_open, pps.entry_price, pps.status AS position_status,
                tp.company_name
         FROM position_close_requests pcr
         JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
         JOIN trade_plans tp ON tp.id = pps.trade_plan_id
         WHERE pps.portfolio_id = $1
         ORDER BY pcr.created_at DESC
         LIMIT $2 OFFSET $3`,
        [portfolioId, limit, offset]
      ),
    ]);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(countResult.rows[0].total, page, limit),
    });
  } catch (e) {
    console.error('[elite/close-requests] GET error', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch close requests' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

  try {
    // Accept multipart (with optional evidence file)
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err('BAD_REQUEST', 'Invalid form data', 400);
    }

    const positionId = Number(formData.get('position_id'));
    const requestedQuantity = Number(formData.get('requested_quantity'));
    const requestedExitPrice = formData.get('requested_exit_price')
      ? Number(formData.get('requested_exit_price'))
      : null;
    const requestNote = formData.get('request_note')
      ? String(formData.get('request_note')).trim()
      : null;
    const forceClose = String(formData.get('force_close') || '').toLowerCase() === 'true';
    const evidenceFile = formData.get('evidence');

    if (!positionId || isNaN(positionId)) {
      return err('VALIDATION_ERROR', 'position_id is required', 400);
    }
    if (!requestedQuantity || requestedQuantity <= 0) {
      return err('VALIDATION_ERROR', 'requested_quantity must be > 0', 400);
    }

    // Verify position belongs to this user's portfolio
    const ownerCheck = await pool.query(
      `SELECT pps.id, pps.quantity_open, pps.status
       FROM portfolio_positions_simple pps
       JOIN elite_portfolios_simple eps ON eps.id = pps.portfolio_id
       JOIN elite_members em ON em.id = eps.elite_member_id
       WHERE pps.id = $1 AND em.user_id = $2`,
      [positionId, auth.userId]
    );

    if (!ownerCheck.rows[0]) return err('NOT_FOUND', 'Position not found', 404);

    const position = ownerCheck.rows[0];
    if (!['OPEN', 'PARTIALLY_CLOSED'].includes(position.status)) {
      return err('VALIDATION_ERROR', 'Position is not open', 400);
    }

    if (requestedQuantity > Number(position.quantity_open)) {
      return err('VALIDATION_ERROR', 'Requested quantity exceeds open quantity', 400);
    }

    // Upload evidence if provided
    let evidenceUrl: string | null = null;
    let evidenceName: string | null = null;

    if (evidenceFile instanceof File) {
      const buffer = Buffer.from(await evidenceFile.arrayBuffer());
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

      evidenceUrl = uploadJson.secure_url;
      evidenceName = evidenceFile.name;
    }

    if (forceClose) {
      if (!evidenceUrl) {
        return err('VALIDATION_ERROR', 'Evidence image is required to force close', 400);
      }

      try {
        const forceResult = await programService.forceClosePositionByInvestor(auth.userId, {
          positionId,
          requestedQuantity,
          requestedExitPrice,
          requestNote,
          evidenceUrl,
          evidenceName,
        });

        const { rows } = await pool.query(
          `SELECT pcr.*,
                  pps.symbol, pps.side, pps.quantity_open, pps.entry_price, pps.status AS position_status,
                  tp.company_name
           FROM position_close_requests pcr
           JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
           JOIN trade_plans tp ON tp.id = pps.trade_plan_id
           WHERE pcr.id = $1`,
          [forceResult.requestId],
        );

        return NextResponse.json(rows[0], { status: 201 });
      } catch (e: any) {
        console.error('[elite/close-requests] force close error', e);
        return err('VALIDATION_ERROR', e?.message || 'Failed to force close position', 400);
      }
    }

    try {
      const requestResult = await programService.requestInvestorClose(auth.userId, {
        positionId,
        requestedQuantity,
        requestedExitPrice,
        requestNote,
        evidenceUrl,
        evidenceName,
      });

      const { rows } = await pool.query(
        `SELECT pcr.*,
                pps.symbol, pps.side, pps.quantity_open, pps.entry_price, pps.status AS position_status,
                tp.company_name
         FROM position_close_requests pcr
         JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
         JOIN trade_plans tp ON tp.id = pps.trade_plan_id
         WHERE pcr.id = $1`,
        [requestResult.closeRequestId],
      );

      return NextResponse.json(rows[0], { status: 201 });
    } catch (e: any) {
      console.error('[elite/close-requests] request close error', e);
      const msg: string = e?.message ?? 'Failed to submit close request';
      if (msg.includes('already a pending')) return err('CONFLICT', msg, 409);
      return err('VALIDATION_ERROR', msg, 400);
    }
  } catch (e) {
    console.error('[elite/close-requests] POST error', e);
    return err('INTERNAL_ERROR', 'Failed to submit close request', 500);
  }
}
