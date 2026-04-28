import { NextRequest, NextResponse } from "next/server";
import { assertValidEvidenceUrlForUser, sanitizeEvidenceDisplayName } from "@/lib/evidence-security";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const screenshotUrl = assertValidEvidenceUrlForUser(
      body?.screenshotUrl,
      auth.userId,
      "opening",
    );
    const result = await service.submitTradeExecution(auth.userId, Number(body?.planId || 0), {
      executedQuantity: Number(body?.executedQuantity || 0),
      executedPrice: Number(body?.executedPrice || 0),
      executedAt: String(body?.executedAt || ""),
      screenshotUrl,
      screenshotName: screenshotUrl ? sanitizeEvidenceDisplayName(body?.screenshotName) : null,
      investorNote: body?.investorNote ? String(body.investorNote) : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to submit execution:", error);
    return NextResponse.json({ message: error?.message || "Failed to submit execution." }, { status: 400 });
  }
}
