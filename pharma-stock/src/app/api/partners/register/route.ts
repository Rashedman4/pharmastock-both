import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const result = await service.upsertPartnerApplication(auth.userId, {
      displayName: String(body?.displayName || ""),
      phoneNumber: String(body?.phoneNumber || ""),
      bio: String(body?.bio || ""),
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to save partner application:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to save partner application." },
      { status: 400 },
    );
  }
}
