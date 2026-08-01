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

// Submits a request to change free capital — an admin must approve it before
// it takes effect. See src/app/api/elite/capital-requests/route.ts for
// checking the pending request's status, and
// src/app/api/admin/capital-requests/** for the admin review side.
export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const result = await service.requestCapitalChange(
      auth.userId,
      Number(body?.currentCapitalAmount || 0),
      typeof body?.requestNote === "string" ? body.requestNote : null,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to request capital change:", error);
    return NextResponse.json({ message: error?.message || "Failed to request capital change." }, { status: 400 });
  }
}
