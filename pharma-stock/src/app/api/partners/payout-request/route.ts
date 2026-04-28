import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await service.createPartnerPayoutRequest(auth.userId, {
      iban: typeof body?.iban === "string" ? body.iban : "",
      amount:
        body?.amount == null || body.amount === ""
          ? null
          : Number(body.amount),
      note: typeof body?.note === "string" ? body.note : null,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to create partner payout request:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to create partner payout request." },
      { status: 400 },
    );
  }
}
