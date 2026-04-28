import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await service.reviewPartner(Number(id), auth.userId, true, body?.reviewNote ? String(body.reviewNote) : null);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to approve partner:", error);
    return NextResponse.json({ message: error?.message || "Failed to approve partner." }, { status: 400 });
  }
}
