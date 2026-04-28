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
    const method = String(body?.method || "STRIPE").toUpperCase();

    if (method === "BANK_TRANSFER") {
      const result = await service.createManualFirmProfitPaymentRequest(
        auth.userId,
      );
      return NextResponse.json(result, { status: 200 });
    }

    if (method !== "STRIPE") {
      return NextResponse.json(
        { message: "Unsupported firm profit payment method." },
        { status: 400 },
      );
    }

    const result = await service.createFirmProfitCheckoutSession(auth.userId, {
      origin: request.nextUrl.origin,
      returnPath:
        body?.returnPath && typeof body.returnPath === "string"
          ? body.returnPath
          : null,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to start firm profit payment:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to start firm profit payment." },
      { status: 400 },
    );
  }
}
