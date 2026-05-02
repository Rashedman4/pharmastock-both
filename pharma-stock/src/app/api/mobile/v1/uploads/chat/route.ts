import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { err } from '@/lib/mobile/api-handler';
import { createRateLimiter, rateLimitResponse } from '@/lib/mobile/rate-limit';

export const runtime = 'nodejs';

const uploadLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyFn: (req) => req.headers.get('authorization') ?? req.ip ?? 'unknown',
});

// File size limits per type
const SIZE_LIMITS: Record<string, number> = {
  image: 5 * 1024 * 1024,
  voice: 15 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const BLOCKED_EXTENSIONS = new Set([
  '.php', '.js', '.html', '.htm', '.svg', '.exe', '.sh',
  '.bat', '.cmd', '.apk', '.ipa', '.dmg', '.msi', '.jar',
  '.py', '.rb', '.pl', '.go', '.ts', '.tsx', '.jsx',
]);

// Magic bytes: prefix → allowed upload type
const MAGIC: Array<{ bytes: number[]; offset?: number; ext: string; mime: string }> = [
  { bytes: [0xFF, 0xD8, 0xFF],             ext: 'jpg',  mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4E, 0x47],       ext: 'png',  mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46],       ext: 'webp', mime: 'image/webp' }, // RIFF
  // MP4/M4A/MOV: bytes 4-7 = 'ftyp'
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, ext: 'mp4', mime: 'video/mp4' },
  // MP3: ID3 tag
  { bytes: [0x49, 0x44, 0x33],             ext: 'mp3',  mime: 'audio/mpeg' },
  // MP3: sync word
  { bytes: [0xFF, 0xFB],                   ext: 'mp3',  mime: 'audio/mpeg' },
  // OGG
  { bytes: [0x4F, 0x67, 0x67, 0x53],       ext: 'ogg',  mime: 'audio/ogg' },
  // WAV: RIFF...WAVE
  { bytes: [0x52, 0x49, 0x46, 0x46],       ext: 'wav',  mime: 'audio/wav' },
  // CAF (Core Audio Format) — iOS expo-av HIGH_QUALITY default
  { bytes: [0x63, 0x61, 0x66, 0x66],       ext: 'caf',  mime: 'audio/x-caf' },
];

function detectMimeType(buf: Uint8Array): { ext: string; mime: string } | null {
  for (const sig of MAGIC) {
    const offset = sig.offset ?? 0;
    const match = sig.bytes.every((b, i) => buf[offset + i] === b);
    if (match) return { ext: sig.ext, mime: sig.mime };
  }
  return null;
}

const AUDIO_EXTENSIONS = new Set(['.m4a', '.3gp', '.3gpp', '.aac', '.caf']);

function classifyType(mime: string, ext: string): 'image' | 'voice' | 'video' | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'voice';
  // M4A, 3GP, CAF: detected as video/mp4 (ftyp magic bytes) but are audio containers
  if (mime === 'video/mp4' && AUDIO_EXTENSIONS.has(ext)) return 'voice';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${base}${apiSecret}`).digest('hex');
}

export async function POST(req: NextRequest) {
  const payload = getMobileAuthPayload(req);
  if (!payload) return err('UNAUTHORIZED', 'Authentication required', 401);

  if (!uploadLimiter(req)) return rateLimitResponse();

  // Early content-length gate
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > SIZE_LIMITS.video) {
    return err('FILE_TOO_LARGE', 'File exceeds maximum allowed size', 400);
  }

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

  // Reject blocked extensions
  const name = file.name.toLowerCase();
  const dotIdx = name.lastIndexOf('.');
  const ext = dotIdx >= 0 ? name.slice(dotIdx) : '';
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return err('INVALID_FILE', `Files with extension "${ext}" are not allowed`, 400);
  }

  // Read buffer and validate magic bytes
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectMimeType(new Uint8Array(buffer));
  if (!detected) {
    return err('INVALID_FILE', 'File type could not be verified', 400);
  }

  const fileType = classifyType(detected.mime, ext);
  if (!fileType) {
    return err('INVALID_FILE', 'Unsupported file type', 400);
  }

  // Enforce size limit for detected type
  if (buffer.byteLength > SIZE_LIMITS[fileType]) {
    return err(
      'FILE_TOO_LARGE',
      `${fileType} files must be under ${SIZE_LIMITS[fileType] / 1024 / 1024}MB`,
      400
    );
  }

  // Upload to Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return err('SERVER_ERROR', 'Storage service not configured', 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `chat-media/${payload.userId}`;
  const publicId = crypto.randomUUID();
  const resourceType = fileType === 'image' ? 'image' : 'video'; // Cloudinary 'video' handles audio too

  const signedParams: Record<string, string> = {
    folder,
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const signature = signCloudinaryParams(signedParams, apiSecret);

  const upstream = new FormData();
  upstream.append(
    'file',
    new Blob([buffer], { type: detected.mime }),
    `${publicId}.${detected.ext}`
  );
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
    return err(
      'UPLOAD_FAILED',
      uploadJson?.error?.message ?? 'Failed to upload file',
      500
    );
  }

  return NextResponse.json({
    url: uploadJson.secure_url,
    type: fileType,
    size: buffer.byteLength,
    duration: uploadJson.duration ?? null,
    width: uploadJson.width ?? null,
    height: uploadJson.height ?? null,
  });
}
