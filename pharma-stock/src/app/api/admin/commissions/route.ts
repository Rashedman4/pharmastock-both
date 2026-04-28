import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Static list of commission ledger entries
  const data = [
    {
      id: 1,
      agentId: 2,
      period: "2026-03",
      status: "APPROVED",
      amount: 500,
    },
    {
      id: 2,
      agentId: 2,
      period: "2026-02",
      status: "PAID",
      amount: 1000,
    },
  ];
  return NextResponse.json(data, { status: 200 });
}