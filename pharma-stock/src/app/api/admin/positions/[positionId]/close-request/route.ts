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
    const result = await service.requestAdminClose(auth.userId, {
      positionId: Number(positionId),
      requestedQuantity: Number(body?.requestedQuantity || 0),
      requestedExitPrice: body?.requestedExitPrice == null ? null : Number(body.requestedExitPrice),
      requestNote: body?.requestNote ? String(body.requestNote) : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create admin close request:", error);
    return NextResponse.json({ message: error?.message || "Failed to create close request." }, { status: 400 });
  }
}
