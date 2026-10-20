import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/modules/stocks/stocks.service";

/**
 * GET /api/stocks/search?q=
 *
 * Public: the covered universe is not secret, and the search box on the
 * marketing site uses this too. Searches `stocks` only.
 */
export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return NextResponse.json({ data: await searchStocks(q) });
  } catch (error) {
    console.error("[stocks/search] GET error", error);
    return NextResponse.json(
      { error: "Error searching stocks" },
      { status: 500 }
    );
  }
}
