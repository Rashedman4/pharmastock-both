import { NextRequest, NextResponse } from "next/server";
import { assertValidEvidenceUrlForUser, sanitizeEvidenceDisplayName } from "@/lib/evidence-security";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const { paymentId } = await params;
    const body = await request.json().catch(() => ({}));
    const proofUrl = assertValidEvidenceUrlForUser(
      body?.proofUrl,
      auth.userId,
      "payment",
    );

    const result = await service.submitManualFirmProfitPaymentProof(
      auth.userId,
      Number(paymentId),
      {
        proofUrl: proofUrl || "",
        proofName: proofUrl ? sanitizeEvidenceDisplayName(body?.proofName) : null,
        transferReference: body?.transferReference,
        note: body?.note,
      },
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to submit bank-transfer proof:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to submit bank-transfer proof." },
      { status: 400 },
    );
  }
}
