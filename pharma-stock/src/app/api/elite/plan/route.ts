import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const plans = await service.getInvestorPlans(auth.userId);
    return NextResponse.json(plans, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load trade plans:", error);
    return NextResponse.json({ message: error?.message || "Failed to load trade plans." }, { status: 400 });
  }
}
