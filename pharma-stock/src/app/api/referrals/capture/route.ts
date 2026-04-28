import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body?.code || "").trim();
    const result = await service.validatePartnerReferralCode(code);
    const response = NextResponse.json(
      {
        valid: Boolean(result),
        partnerName: result?.displayName || null,
      },
      { status: 200 },
    );

    if (result?.referralCode) {
      response.cookies.set("partner_ref", String(result.referralCode), {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error("Failed to capture referral:", error);
    return NextResponse.json({ message: "Failed to capture referral." }, { status: 500 });
  }
}
