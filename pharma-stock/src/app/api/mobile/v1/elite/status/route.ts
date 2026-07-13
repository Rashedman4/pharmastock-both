import { NextRequest, NextResponse } from 'next/server';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { ProgramService } from '@/modules/program/program.service';

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
    const status = await service.getEliteStatus(auth.userId);

    if (status.status === 'NONE') {
      return NextResponse.json({
        has_application: false,
        application_status: null,
        application_date: null,
        admin_response: null,
        is_elite_member: false,
        elite_status: null,
        approved_at: null,
        current_capital_amount: null,
      });
    }

    return NextResponse.json({
      has_application: !!status.applicationId,
      application_status: status.applicationId ? status.status : null,
      application_date: status.createdAt ?? null,
      admin_response: status.adminResponse ?? null,
      is_elite_member: !!status.memberId,
      elite_status: status.memberStatus ?? null,
      approved_at: status.approvedAt ?? null,
      current_capital_amount: status.memberId != null ? String(status.currentCapitalAmount) : null,
    });
  } catch (err) {
    console.error('[elite/status] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load elite status' } },
      { status: 500 }
    );
  }
}
