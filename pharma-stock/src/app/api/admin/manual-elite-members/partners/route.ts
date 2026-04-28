import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const query = request.nextUrl.searchParams.get("query");
    const rows = await service.listApprovedPartnersForManualAttach(query);
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to load partners." },
      { status: 400 },
    );
  }
}
