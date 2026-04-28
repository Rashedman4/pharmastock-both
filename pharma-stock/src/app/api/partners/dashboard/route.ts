import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const data = await service.getPartnerDashboard(auth.userId);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Failed to load partner dashboard:", error);
    return NextResponse.json({ message: "Failed to load partner dashboard." }, { status: 500 });
  }
}
