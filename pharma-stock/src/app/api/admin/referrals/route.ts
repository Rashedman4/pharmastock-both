import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const data = await service.getAdminReferralSummary();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Failed to load referral summary:", error);
    return NextResponse.json({ message: "Failed to load referral summary." }, { status: 500 });
  }
}
