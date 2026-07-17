import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getToken } from 'next-auth/jwt';

export const runtime = 'nodejs';

const SIZE_LIMITS: Record<string, number> = {
  image: 5 * 1024 * 1024,
  voice: 15 * 1024 * 1024,
  // Matches the mobile app's own upload limit (src/app/api/mobile/v1/uploads/chat/route.ts)
  video: 100 * 1024 * 1024,
};

const BLOCKED_EXTENSIONS = new Set([
  '.php', '.js', '.html', '.htm', '.svg', '.exe', '.sh',
  '.bat', '.cmd', '.apk', '.ipa', '.dmg', '.msi', '.jar',
  '.py', '.rb', '.pl', '.go', '.ts', '.tsx', '.jsx',
]);

// Covers all types the admin can produce: images from picker + browser-recorded audio
const MAGIC: Array<{ bytes: number[]; offset?: number; ext: string; mime: string }> = [
  { bytes: [0xFF, 0xD8, 0xFF],             ext: 'jpg',  mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4E, 0x47],       ext: 'png',  mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46],       ext: 'webp', mime: 'image/webp' }, // RIFF…WEBP
  // Browser MediaRecorder outputs (Chrome/Edge → webm, Firefox → ogg, Safari → mp4)
  { bytes: [0x1A, 0x45, 0xDF, 0xA3],       ext: 'webm', mime: 'audio/webm' }, // Chrome / Edge
  { bytes: [0x4F, 0x67, 0x67, 0x53],       ext: 'ogg',  mime: 'audio/ogg'  }, // Firefox
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, ext: 'mp4', mime: 'audio/mp4' }, // Safari
  { bytes: [0x49, 0x44, 0x33],             ext: 'mp3',  mime: 'audio/mpeg' },
  { bytes: [0xFF, 0xFB],                   ext: 'mp3',  mime: 'audio/mpeg' },
];

function detectMime(buf: Uint8Array): { ext: string; mime: string } | null {
  for (const sig of MAGIC) {
    const off = sig.offset ?? 0;
    if (sig.bytes.every((b, i) => buf[off + i] === b)) return { ext: sig.ext, mime: sig.mime };
  }
  return null;
}

function classifyType(mime: string): 'image' | 'voice' | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'voice';
  return null;
}

// Video is only ever picked via the dedicated "attach video" button (kind='video'
// on the request), never the mic recorder — so unlike the voice-note case above,
// there's no need to disambiguate an mp4/webm container from an audio recording.
const VIDEO_MAGIC: Array<{ bytes: number[]; offset?: number; ext: string; mime: string }> = [
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, ext: 'mp4',  mime: 'video/mp4' },  // MP4/MOV
  { bytes: [0x1A, 0x45, 0xDF, 0xA3],             ext: 'webm', mime: 'video/webm' }, // WebM/Matroska
];

function detectVideoMime(buf: Uint8Array): { ext: string; mime: string } | null {
  for (const sig of VIDEO_MAGIC) {
    const off = sig.offset ?? 0;
    if (sig.bytes.every((b, i) => buf[off + i] === b)) return { ext: sig.ext, mime: sig.mime };
  }
  return null;
}

function signCloudinary(params: Record<string, string>, secret: string): string {
  const base = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(`${base}${secret}`).digest('hex');
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (token?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }); }

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file field required' }, { status: 400 });

  const isVideoUpload = formData.get('kind') === 'video';

  // Extension check
  const name = file.name.toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `"${ext}" files are not allowed` }, { status: 400 });
  }

  // Magic bytes
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = isVideoUpload ? detectVideoMime(new Uint8Array(buffer)) : detectMime(new Uint8Array(buffer));
  if (!detected) return NextResponse.json({ error: 'Unrecognised file type' }, { status: 400 });

  const fileType = isVideoUpload ? 'video' : classifyType(detected.mime);
  if (!fileType) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

  const limit = SIZE_LIMITS[fileType];
  if (buffer.byteLength > limit) {
    return NextResponse.json(
      { error: `${fileType} must be under ${limit / 1024 / 1024} MB` },
      { status: 400 }
    );
  }

  // Cloudinary upload
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  const timestamp    = Math.floor(Date.now() / 1000);
  const folder       = 'chat-media/admin';
  const publicId     = crypto.randomUUID();
  const resourceType = fileType === 'image' ? 'image' : 'video'; // Cloudinary uses 'video' for audio too

  const signedParams: Record<string, string> = {
    folder, public_id: publicId, timestamp: String(timestamp),
  };
  const signature = signCloudinary(signedParams, apiSecret);

  const upstream = new FormData();
  upstream.append('file', new Blob([buffer], { type: detected.mime }), `${publicId}.${detected.ext}`);
  upstream.append('api_key', apiKey);
  upstream.append('timestamp', String(timestamp));
  upstream.append('folder', folder);
  upstream.append('public_id', publicId);
  upstream.append('signature', signature);

  const upRes  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: 'POST', body: upstream });
  const upJson = await upRes.json().catch(() => ({}));
  if (!upRes.ok) {
    return NextResponse.json({ error: upJson?.error?.message ?? 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({
    url:      upJson.secure_url,
    type:     fileType,
    size:     buffer.byteLength,
    duration: upJson.duration  ?? null,
    width:    upJson.width     ?? null,
    height:   upJson.height    ?? null,
  });
}
