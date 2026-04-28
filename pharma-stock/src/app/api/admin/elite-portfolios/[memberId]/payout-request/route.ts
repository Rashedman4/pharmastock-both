
import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { memberId } = await params;
    const result = await service.createAdminPayoutRequest(
      Number(memberId),
      auth.userId,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to create admin payout request:", error);
    return NextResponse.json(
      {
        message:
          error?.message || "Failed to create admin payout request.",
      },
      { status: 400 },
    );
  }
}
