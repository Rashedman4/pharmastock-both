import { NextRequest, NextResponse } from "next/server";
import { getOptionalAuthUser } from "@/modules/program/route-helpers";
import { getStockDetail } from "@/modules/stocks/stocks.service";

/**
 * GET /api/stocks/[symbol]
 *
 * Public. A signed-in caller also gets their watch state; a guest gets
 * `is_watched: false` and the page offers the auth modal instead.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const auth = await getOptionalAuthUser(req);
    const stock = await getStockDetail(symbol, auth?.userId ?? null);

    if (!stock) {
      return NextResponse.json(
        { error: `${symbol.toUpperCase()} is not a covered stock` },
        { status: 404 }
      );
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error("[stocks/:symbol] GET error", error);
    return NextResponse.json({ error: "Error fetching stock" }, { status: 500 });
  }
}
