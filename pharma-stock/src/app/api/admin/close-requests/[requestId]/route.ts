import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { requestId } = await params;
    const body = await request.json();
    const result = await service.respondAdminCloseRequest(
      auth.userId,
      Number(requestId),
      String(body?.decision || ""),
      body?.responseNote ? String(body.responseNote) : null,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to respond to close request:", error);
    return NextResponse.json({ message: error?.message || "Failed to respond to close request." }, { status: 400 });
  }
}
