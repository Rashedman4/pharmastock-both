import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";
import pool from "@/lib/db";
import { createNotification } from "@/lib/services/notification.service";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ positionId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { positionId } = await params;
    const body = await request.json();
    const result = await service.requestAdminClose(auth.userId, {
      positionId: Number(positionId),
      requestedQuantity: Number(body?.requestedQuantity || 0),
      requestedExitPrice: body?.requestedExitPrice == null ? null : Number(body.requestedExitPrice),
      requestNote: body?.requestNote ? String(body.requestNote) : null,
    });

    // Notify the investor
    try {
      const investorRes = await pool.query(
        `SELECT em.user_id, pps.symbol
         FROM portfolio_positions_simple pps
         JOIN elite_portfolios_simple eps ON eps.id = pps.portfolio_id
         JOIN elite_members em ON em.id = eps.elite_member_id
         WHERE pps.id = $1`,
        [Number(positionId)]
      );
      if (investorRes.rows[0]?.user_id) {
        const { user_id, symbol } = investorRes.rows[0];
        await createNotification({
          userId: user_id,
          type: 'CLOSE_REQUEST',
          title: 'Close Request from Admin',
          body: `The admin has requested to close your ${symbol} position. Please review and execute.`,
          data: { screen: 'portfolio' },
        });
      }
    } catch (notifErr) {
      console.error('[Notification] admin_close_request:', notifErr);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create admin close request:", error);
    return NextResponse.json({ message: error?.message || "Failed to create close request." }, { status: 400 });
  }
}
