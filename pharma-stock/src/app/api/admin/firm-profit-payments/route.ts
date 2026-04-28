import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const status = request.nextUrl.searchParams.get("status");
    const payments = await service.listAdminFirmProfitPayments(status);
    return NextResponse.json(payments, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load firm profit payments:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to load firm profit payments." },
      { status: 400 },
    );
  }
}
