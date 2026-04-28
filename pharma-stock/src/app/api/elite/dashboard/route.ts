import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const dashboard = await service.getInvestorDashboard(auth.userId);
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load elite dashboard:", error);
    return NextResponse.json({ message: error?.message || "Failed to load elite dashboard." }, { status: 400 });
  }
}
