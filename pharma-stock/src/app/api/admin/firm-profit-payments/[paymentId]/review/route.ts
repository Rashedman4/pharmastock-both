import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";
import { createNotification } from "@/lib/services/notification.service";
import pool from "@/lib/db";

export const runtime = "nodejs";
const service = new ProgramService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { paymentId } = await params;
    const body = await request.json().catch(() => ({}));
    const decision = String(body?.decision || "").toUpperCase() as "APPROVE" | "REJECT";

    const pmtRow = await pool.query(
      `SELECT investor_user_id, amount_requested FROM firm_profit_payments WHERE id = $1`,
      [Number(paymentId)]
    );
    const pmt = pmtRow.rows[0];

    const result = await service.reviewManualFirmProfitPayment(
      auth.userId,
      Number(paymentId),
      { decision, reviewNote: body?.reviewNote },
    );

    if (pmt && decision === 'APPROVE') {
      try {
        await createNotification({
          userId: pmt.investor_user_id,
          type: 'payout_update',
          title: 'Payment Processed',
          body: `Your firm profit payment of $${Number(pmt.amount_requested).toLocaleString()} has been processed.`,
          data: { screen: 'elite', paymentId: Number(paymentId) },
        });
      } catch (e) { console.error('[Notification] payment_paid:', e); }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review firm profit payment:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to review firm profit payment." },
      { status: 400 },
    );
  }
}
