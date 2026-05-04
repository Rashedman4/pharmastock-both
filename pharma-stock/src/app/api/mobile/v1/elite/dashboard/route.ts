import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/modules/program/program.service';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';

export const runtime = 'nodejs';

const service = new ProgramService();

export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  try {
    const dashboard = await service.getInvestorDashboard(auth.userId);
    return NextResponse.json(dashboard);
  } catch (err: any) {
    console.error('[elite/dashboard] GET error', err);
    const msg: string = err?.message ?? '';
    if (msg.includes('not an elite') || msg.includes('not found') || msg.includes('no portfolio')) {
      return NextResponse.json(
        { error: { code: 'NOT_ELITE_MEMBER', message: 'You are not an active elite member' } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard' } },
      { status: 500 }
    );
  }
}
