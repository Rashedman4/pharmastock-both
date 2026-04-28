import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const partner = await service.getPartnerAccountByUserId(auth.userId);
    if (!partner) return NextResponse.json({ status: "NONE" }, { status: 200 });
    return NextResponse.json(partner, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch partner account:", error);
    return NextResponse.json({ message: "Failed to load partner account." }, { status: 500 });
  }
}
