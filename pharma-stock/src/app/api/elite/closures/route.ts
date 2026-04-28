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
    const evidenceUrl = assertValidEvidenceUrlForUser(
      body?.evidenceUrl,
      auth.userId,
      "closing",
    );
    const evidenceName = evidenceUrl ? sanitizeEvidenceDisplayName(body?.evidenceName) : null;

    if (body?.action === "RESPOND") {
      const result = await service.respondInvestorCloseRequest(
        auth.userId,
        Number(body?.requestId || 0),
        String(body?.decision || ""),
        body?.responseNote ? String(body.responseNote) : null,
        evidenceUrl,
        evidenceName,
      );
      return NextResponse.json(result, { status: 200 });
    }

    if (body?.action === "FORCE_CLOSE") {
      const result = await service.forceClosePositionByInvestor(auth.userId, {
        positionId: Number(body?.positionId || 0),
        requestedQuantity: body?.requestedQuantity == null ? null : Number(body.requestedQuantity),
        requestedExitPrice: body?.requestedExitPrice == null ? null : Number(body.requestedExitPrice),
        requestNote: body?.requestNote ? String(body.requestNote) : null,
        evidenceUrl,
        evidenceName,
      });
      return NextResponse.json(result, { status: 200 });
    }

    const result = await service.requestInvestorClose(auth.userId, {
      positionId: Number(body?.positionId || 0),
      requestedQuantity: Number(body?.requestedQuantity || 0),
      requestedExitPrice: body?.requestedExitPrice == null ? null : Number(body.requestedExitPrice),
      requestNote: body?.requestNote ? String(body.requestNote) : null,
      evidenceUrl,
      evidenceName,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to handle closure request:", error);
    return NextResponse.json({ message: error?.message || "Failed to handle closure request." }, { status: 400 });
  }
}
