import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const portfolio = await service.getInvestorPortfolio(auth.userId);
    return NextResponse.json(portfolio, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load portfolio:", error);
    return NextResponse.json({ message: error?.message || "Failed to load portfolio." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const result = await service.updateCurrentCapital(auth.userId, Number(body?.currentCapitalAmount || 0));
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update capital:", error);
    return NextResponse.json({ message: error?.message || "Failed to update capital." }, { status: 400 });
  }
}
