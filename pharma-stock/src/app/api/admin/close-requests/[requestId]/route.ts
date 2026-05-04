import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";
import pool from "@/lib/db";
import { createNotification } from "@/lib/services/notification.service";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { requestId } = await params;
    const body = await request.json();
    const decision = String(body?.decision || "");
    const result = await service.respondAdminCloseRequest(
      auth.userId,
      Number(requestId),
      decision,
      body?.responseNote ? String(body.responseNote) : null,
    );

    // Notify the investor of the admin's decision
    try {
      const investorRes = await pool.query(
        `SELECT em.user_id, pps.symbol
         FROM position_close_requests pcr
         JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
         JOIN elite_portfolios_simple eps ON eps.id = pps.portfolio_id
         JOIN elite_members em ON em.id = eps.elite_member_id
         WHERE pcr.id = $1`,
        [Number(requestId)]
      );
      if (investorRes.rows[0]?.user_id) {
        const { user_id, symbol } = investorRes.rows[0];
        const approved = decision.toUpperCase() === 'ACCEPTED';
        await createNotification({
          userId: user_id,
          type: 'CLOSE_REQUEST',
          title: approved ? 'Close Request Approved' : 'Close Request Rejected',
          body: approved
            ? `Your close request for ${symbol} has been approved and executed.`
            : `Your close request for ${symbol} was rejected by the admin.`,
          data: { screen: 'portfolio' },
        });
      }
    } catch (notifErr) {
      console.error('[Notification] admin_respond_close_request:', notifErr);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to respond to close request:", error);
    return NextResponse.json({ message: error?.message || "Failed to respond to close request." }, { status: 400 });
  }
}
