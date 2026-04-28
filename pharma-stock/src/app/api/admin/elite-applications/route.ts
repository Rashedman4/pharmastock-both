import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const investors = await service.listAdminInvestors();
    return NextResponse.json(investors, { status: 200 });
  } catch (error) {
    console.error("Failed to load elite applications:", error);
    return NextResponse.json({ message: "Failed to load elite applications." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const result = await service.reviewInvestorApplication(
      Number(body?.applicationId || 0),
      auth.userId,
      Boolean(body?.approve),
      body?.adminNote ? String(body.adminNote) : null,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review elite application:", error);
    return NextResponse.json({ message: error?.message || "Failed to review elite application." }, { status: 400 });
  }
}
