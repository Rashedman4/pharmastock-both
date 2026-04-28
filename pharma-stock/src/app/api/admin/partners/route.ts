import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const partners = await service.listAdminPartners();
    return NextResponse.json(partners, { status: 200 });
  } catch (error) {
    console.error("Failed to load partners:", error);
    return NextResponse.json({ message: "Failed to load partners." }, { status: 500 });
  }
}
