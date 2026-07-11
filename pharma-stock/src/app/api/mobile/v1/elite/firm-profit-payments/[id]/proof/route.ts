import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { err } from '@/lib/mobile/api-handler';

export const runtime = 'nodejs';

const BLOCKED_EXTENSIONS = new Set([
  '.php', '.js', '.html', '.htm', '.svg', '.exe', '.sh',
  '.bat', '.cmd', '.apk', '.ipa', '.dmg', '.msi', '.jar',
  '.py', '.rb', '.pl', '.go', '.ts', '.tsx',
]);

const MAGIC: Array<{ bytes: number[]; offset?: number; ext: string; mime: string }> = [
  { bytes: [0xFF, 0xD8, 0xFF],       ext: 'jpg',  mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4E, 0x47], ext: 'png',  mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], ext: 'webp', mime: 'image/webp' },
  { bytes: [0x25, 0x50, 0x44, 0x46], ext: 'pdf',  mime: 'application/pdf' },
];

function detectMime(buf: Uint8Array): { ext: string; mime: string } | null {
  for (const sig of MAGIC) {
    const offset = sig.offset ?? 0;
    if (sig.bytes.every((b, i) => buf[offset + i] === b)) return { ext: sig.ext, mime: sig.mime };
  }
  return null;
}

function signCloudinaryParams(p: Record<string, string>, secret: string): string {
  const base = Object.keys(p).sort().map((k) => `${k}=${p[k]}`).join('&');
  return crypto.createHash('sha1').update(`${base}${secret}`).digest('hex');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getMobileAuthPayload(req);
  if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

  try {
    const { id } = await params;
    const paymentId = Number(id);

    // Verify payment belongs to this user and is in AWAITING_TRANSFER state
    const paymentRes = await pool.query(
      `SELECT id, status, investor_user_id FROM firm_profit_payments
       WHERE id = $1 AND investor_user_id = $2`,
      [paymentId, auth.userId]
    );

    if (!paymentRes.rows[0]) {
      return err('NOT_FOUND', 'Payment not found', 404);
    }

    const payment = paymentRes.rows[0];
    if (payment.status !== 'AWAITING_TRANSFER') {
      return err('VALIDATION_ERROR', `Cannot upload proof for payment in status: ${payment.status}`, 400);
    }

    // Parse multipart form
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err('BAD_REQUEST', 'Invalid multipart form data', 400);
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return err('BAD_REQUEST', 'file field is required', 400);
    }

    const name = file.name.toLowerCase();
    const dotIdx = name.lastIndexOf('.');
    const ext = dotIdx >= 0 ? name.slice(dotIdx) : '';
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return err('INVALID_FILE', `Files with extension "${ext}" are not allowed`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return err('FILE_TOO_LARGE', 'File must be under 10MB', 400);
    }

    const detected = detectMime(new Uint8Array(buffer));
    if (!detected || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(detected.mime)) {
      return err('INVALID_FILE', 'Only image (JPG, PNG, WebP) or PDF files are allowed', 400);
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return err('SERVER_ERROR', 'Storage service not configured', 500);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `elite-evidence/${auth.userId}`;
    const publicId = crypto.randomUUID();
    const resourceType = detected.mime === 'application/pdf' ? 'raw' : 'image';

    const signedParams: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp: String(timestamp),
    };
    const signature = signCloudinaryParams(signedParams, apiSecret);

    const upstream = new FormData();
    upstream.append('file', new Blob([buffer], { type: detected.mime }), `${publicId}.${detected.ext}`);
    upstream.append('api_key', apiKey);
    upstream.append('timestamp', String(timestamp));
    upstream.append('folder', folder);
    upstream.append('public_id', publicId);
    upstream.append('signature', signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: upstream }
    );

    const uploadJson = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      return err('UPLOAD_FAILED', uploadJson?.error?.message ?? 'Failed to upload file', 500);
    }

    const proofUrl: string = uploadJson.secure_url;
    const transferReference = formData.get('transfer_reference')
      ? String(formData.get('transfer_reference')).trim()
      : null;
    // Update the payment record
    await pool.query(
      `UPDATE firm_profit_payments
       SET proof_url = $1,
           proof_name = $2,
           transfer_reference = $3,
           submitted_at = NOW(),
           status = 'PROOF_SUBMITTED',
           updated_at = NOW()
       WHERE id = $4`,
      [proofUrl, file.name, transferReference, paymentId]
    );

    return NextResponse.json({ success: true, proof_url: proofUrl }, { status: 200 });
  } catch (e) {
    console.error('[elite/firm-profit-payments/[id]/proof] POST error', e);
    return err('INTERNAL_ERROR', 'Failed to submit proof', 500);
  }
}
