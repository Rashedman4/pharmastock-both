import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const pending = await service.getPendingFirmProfitByMember();
    return NextResponse.json(pending, { status: 200 });
  } catch (error) {
    console.error("Failed to load pending firm profit:", error);
    return NextResponse.json({ message: "Failed to load pending firm profit." }, { status: 500 });
  }
}
