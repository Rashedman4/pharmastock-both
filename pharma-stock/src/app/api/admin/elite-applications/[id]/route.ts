import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status || '').toUpperCase();
    const result = await service.reviewInvestorApplication(
      Number(id),
      auth.userId,
      status === 'APPROVED',
      body?.adminNote ? String(body.adminNote) : body?.adminResponse ? String(body.adminResponse) : null,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review elite application:", error);
    return NextResponse.json({ message: error?.message || "Failed to review elite application." }, { status: 400 });
  }
}
