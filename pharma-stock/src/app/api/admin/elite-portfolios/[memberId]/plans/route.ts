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
    const result = await service.createAdminTradePlan(Number(memberId), auth.userId, {
      symbol: String(body?.symbol || ""),
      companyName: body?.companyName ? String(body.companyName) : null,
      referenceMarketPrice: body?.referenceMarketPrice == null ? null : Number(body.referenceMarketPrice),
      targetEntryPrice: body?.targetEntryPrice == null ? null : Number(body.targetEntryPrice),
      targetPrice1: body?.targetPrice1 == null ? null : Number(body.targetPrice1),
      targetPrice2: body?.targetPrice2 == null ? null : Number(body.targetPrice2),
      stopLossPrice: body?.stopLossPrice == null ? null : Number(body.stopLossPrice),
      suggestedQuantity: Number(body?.suggestedQuantity || 0),
      plannedAt: body?.plannedAt ? String(body.plannedAt) : null,
      adminNote: body?.adminNote ? String(body.adminNote) : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create trade plan:", error);
    return NextResponse.json({ message: error?.message || "Failed to create trade plan." }, { status: 400 });
  }
}
