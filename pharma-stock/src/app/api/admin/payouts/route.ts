import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Static list of payout batches
  const data = [
    {
      id: 1,
      createdAt: "2026-03-25",
      status: "PROCESSING",
      totalAmount: 500,
      items: [
        { agentId: 2, amount: 500, status: "PROCESSING" },
      ],
    },
  ];
  return NextResponse.json(data, { status: 200 });
}