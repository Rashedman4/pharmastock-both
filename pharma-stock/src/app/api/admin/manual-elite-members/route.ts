import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const query = request.nextUrl.searchParams.get("query");
    const users = await service.listEligibleUsersForManualEliteMember(query);
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load manual elite candidates:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to load manual elite candidates." },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const result = await service.createManualEliteMemberFromUser(
      Number(body?.userId || 0),
      auth.userId,
      {
        currentCapitalAmount: Number(body?.currentCapitalAmount || 0),
        note: body?.note ? String(body.note) : null,
        partnerAccountId: body?.partnerAccountId
          ? Number(body.partnerAccountId)
          : null,
      },
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to create manual elite member:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to create manual elite member." },
      { status: 400 },
    );
  }
}
