import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/modules/program/program.service';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { createRateLimiter, rateLimitResponse } from '@/lib/mobile/rate-limit';

export const runtime = 'nodejs';

const service = new ProgramService();

const applyLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 6,
  keyFn: (req) => req.headers.get('authorization') ?? 'unknown',
});

export async function POST(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  if (!applyLimiter(req)) return rateLimitResponse();

  try {
    const body = await req.json().catch(() => ({}));

    const phoneNumber = String(body?.phone_number || '').trim();
    const investmentAmount = Number(body?.investment_amount || 0);
    const description = body?.description ? String(body.description).trim() : null;
    // Mobile: referral_code entered manually by user, not from cookie
    const referralCode = body?.referral_code ? String(body.referral_code).trim() : null;
    const agreementAccepted = body?.agreement_accepted === true;
    const agreementVersion = body?.agreement_version ? String(body.agreement_version) : null;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Phone number is required', field: 'phone_number' } },
        { status: 400 }
      );
    }
    if (!agreementAccepted || !agreementVersion) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'You must accept the Elite Program Agreement', field: 'agreement_accepted' } },
        { status: 400 }
      );
    }

    const result = await service.submitEliteApplication(
      auth.userId,
      { phoneNumber, investmentAmount, description, agreementAccepted, agreementVersion },
      referralCode || null,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('[elite/apply] POST error', err);
    const msg: string = err?.message ?? 'Failed to submit elite application';

    if (msg.includes('already have')) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_APPLICATION', message: msg } },
        { status: 409 }
      );
    }
    if (msg.includes('Minimum') || msg.includes('required')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: msg } },
      { status: 400 }
    );
  }
}
