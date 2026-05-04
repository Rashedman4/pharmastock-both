import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";
import { createNotification } from "@/lib/services/notification.service";
import pool from "@/lib/db";

export const runtime = "nodejs";
const service = new ProgramService();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status || '').toUpperCase();
    const approve = status === 'APPROVED';

    const appRow = await pool.query(
      `SELECT user_id FROM elite_applications WHERE id = $1`,
      [Number(id)]
    );
    const targetUserId: number | null = appRow.rows[0]?.user_id ?? null;

    const result = await service.reviewInvestorApplication(
      Number(id),
      auth.userId,
      approve,
      body?.adminNote ? String(body.adminNote) : body?.adminResponse ? String(body.adminResponse) : null,
    );

    if (targetUserId) {
      try {
        await createNotification({
          userId: targetUserId,
          type: 'elite_update',
          title: approve ? 'Elite Application Approved' : 'Elite Application Update',
          body: approve
            ? 'Your elite application has been approved. Welcome to the elite program.'
            : 'Your elite application has been reviewed. Please check the details.',
          data: { screen: 'elite' },
        });
      } catch (e) { console.error('[Notification] elite_review_id:', e); }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review elite application:", error);
    return NextResponse.json({ message: error?.message || "Failed to review elite application." }, { status: 400 });
  }
}
