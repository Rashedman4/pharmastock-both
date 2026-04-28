
import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const result = await service.createInvestorPayoutRequest(auth.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to request payout:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to request payout." },
      { status: 400 },
    );
  }
}
