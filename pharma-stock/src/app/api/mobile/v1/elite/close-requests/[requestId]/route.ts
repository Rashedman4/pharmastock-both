import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { ProgramService } from '@/modules/program/program.service';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { err } from '@/lib/mobile/api-handler';

export const runtime = 'nodejs';

const service = new ProgramService();

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

// PATCH /api/mobile/v1/elite/close-requests/[requestId]
// Investor responds to an admin-initiated close request (ACCEPTED = execute, REJECTED = decline)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const auth = getMobileAuthPayload(req);
  if (!auth) return err('UNAUTHORIZED', 'Valid Bearer token required', 401);

  try {
    const { requestId } = await params;
    const id = Number(requestId);
    if (!id || isNaN(id)) return err('BAD_REQUEST', 'Invalid requestId', 400);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err('BAD_REQUEST', 'Invalid form data', 400);
    }

    const decision = String(formData.get('decision') ?? '').toUpperCase();
    if (!['ACCEPTED', 'REJECTED'].includes(decision)) {
      return err('VALIDATION_ERROR', 'decision must be ACCEPTED or REJECTED', 400);
    }

    const responseNote = formData.get('response_note')
      ? String(formData.get('response_note')).trim()
      : null;

    const evidenceFile = formData.get('evidence');

    // Upload evidence to Cloudinary if provided
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

    const result = await service.respondInvestorCloseRequest(
      auth.userId,
      id,
      decision,
      responseNote,
      evidenceUrl,
      evidenceName,
    );

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[elite/close-requests/[requestId]] PATCH error', e);
    const msg: string = e?.message ?? '';
    if (msg.includes('not found')) return err('NOT_FOUND', msg, 404);
    if (msg.includes('Only admin')) return err('FORBIDDEN', msg, 403);
    return err('INTERNAL_ERROR', msg || 'Failed to respond to close request', 500);
  }
}
