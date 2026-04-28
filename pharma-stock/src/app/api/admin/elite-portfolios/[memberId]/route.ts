import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { memberId } = await params;
    const investor = await service.getAdminInvestorDetail(Number(memberId));
    return NextResponse.json(investor, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load investor detail:", error);
    return NextResponse.json({ message: error?.message || "Failed to load investor detail." }, { status: 400 });
  }
}
