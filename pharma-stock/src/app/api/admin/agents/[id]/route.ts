import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const partner = await service.getAdminPartnerDetail(Number(id));
    return NextResponse.json(partner, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load agent detail:", error);
    return NextResponse.json({ message: error?.message || "Failed to load partner detail." }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const result = await service.reviewPartner(Number(id), auth.userId, Boolean(body?.approve), body?.reviewNote ? String(body.reviewNote) : null);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review agent detail:", error);
    return NextResponse.json({ message: error?.message || "Failed to review partner." }, { status: 400 });
  }
}
