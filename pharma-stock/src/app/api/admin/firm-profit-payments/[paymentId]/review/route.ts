import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

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
    const result = await service.reviewManualFirmProfitPayment(
      auth.userId,
      Number(paymentId),
      {
        decision: String(body?.decision || "").toUpperCase() as
          | "APPROVE"
          | "REJECT",
        reviewNote: body?.reviewNote,
      },
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review firm profit payment:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to review firm profit payment." },
      { status: 400 },
    );
  }
}
