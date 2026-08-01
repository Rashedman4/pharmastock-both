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
    const requests = await service.listCapitalChangeRequests(status);
    return NextResponse.json(requests, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load capital change requests:", error);
    return NextResponse.json({ message: error?.message || "Failed to load capital change requests." }, { status: 400 });
  }
}
