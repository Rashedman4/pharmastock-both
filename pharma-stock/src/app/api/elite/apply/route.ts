import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const referralCode = request.cookies.get("partner_ref")?.value || request.cookies.get("referral_code")?.value || null;
    const result = await service.submitEliteApplication(
      auth.userId,
      {
        phoneNumber: String(body?.phoneNumber || ""),
        investmentAmount: Number(body?.investmentAmount || 0),
        description: body?.description ? String(body.description) : null,
      },
      referralCode,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to submit elite application:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to submit elite application." },
      { status: 400 },
    );
  }
}
