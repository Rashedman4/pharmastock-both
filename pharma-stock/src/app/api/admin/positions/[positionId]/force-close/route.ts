import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

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
    const result = await service.forceClosePositionByAdmin(
      auth.userId,
      Number(positionId),
      {
        requestedQuantity:
          body?.requestedQuantity == null ? null : Number(body.requestedQuantity),
        requestedExitPrice:
          body?.requestedExitPrice == null ? null : Number(body.requestedExitPrice),
        requestNote: body?.requestNote ? String(body.requestNote) : null,
      },
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to force close position:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to force close position." },
      { status: 400 },
    );
  }
}
