import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { planId } = await params;
    const body = await request.json();
    const result = await service.addAdminPlanMessage(auth.userId, Number(planId), String(body?.message || ""));
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to send admin plan message:", error);
    return NextResponse.json({ message: error?.message || "Failed to send admin message." }, { status: 400 });
  }
}
