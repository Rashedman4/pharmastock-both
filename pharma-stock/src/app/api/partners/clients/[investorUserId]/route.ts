import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ investorUserId: string }> },
) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const { investorUserId } = await params;
    const data = await service.getPartnerClientDetail(auth.userId, Number(investorUserId));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load partner client detail:", error);
    return NextResponse.json({ message: error?.message || "Failed to load client detail." }, { status: 400 });
  }
}
