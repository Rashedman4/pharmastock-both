import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      message: "This endpoint is deprecated. Use /admin/elite-portfolios/[memberId] and create a trade plan instead.",
    },
    { status: 410 },
  );
}
