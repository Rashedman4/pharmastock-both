import { NextRequest, NextResponse } from "next/server";
import { QuotesService } from "@/modules/market-data/quotes.service";

// This route returns current quote information for one or more symbols.
// Query parameter `symbols` should contain a comma separated list of ticker
// symbols (e.g. /api/market/quotes?symbols=AAPL,GOOG). Quotes are
// retrieved from the Financial Modeling Prep API and persisted to
// the price cache table.

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") || "";
  const symbols = symbolsParam
    .split(/,\s*/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
  const service = new QuotesService();
  try {
    const quotes = await service.getQuotes(symbols);
    return NextResponse.json({ quotes }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/market/quotes:", err);
    return NextResponse.json(
      { message: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}