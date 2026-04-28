import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { memberId } = await params;
    const body = await request.json();
    const result = await service.forceOpenTradePlanByAdmin(
      Number(memberId),
      auth.userId,
      {
        planId: Number(body?.planId || 0),
        executedQuantity:
          body?.executedQuantity == null ? null : Number(body.executedQuantity),
        executedPrice:
          body?.executedPrice == null ? null : Number(body.executedPrice),
        executedAt: body?.executedAt ? String(body.executedAt) : null,
        investorNote: body?.investorNote ? String(body.investorNote) : null,
      },
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to force open trade plan:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to force open trade plan." },
      { status: 400 },
    );
  }
}
