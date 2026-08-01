import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

// Returns the investor's currently pending capital change request, if any
// (null otherwise), so the UI can show "awaiting admin approval" state.
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const pending = await service.getPendingCapitalChangeRequest(auth.userId);
    return NextResponse.json({ pending }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load pending capital request:", error);
    return NextResponse.json({ message: error?.message || "Failed to load pending capital request." }, { status: 400 });
  }
}
