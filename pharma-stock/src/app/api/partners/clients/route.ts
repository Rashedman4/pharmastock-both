import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { getAuthUser } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const clients = await service.getPartnerClients(auth.userId);
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Failed to load partner clients:", error);
    return NextResponse.json({ message: "Failed to load partner clients." }, { status: 500 });
  }
}
