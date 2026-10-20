import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/modules/program/route-helpers";
import {
  addToWatchlist,
  getWatchlist,
  WATCHLIST_MAX_SYMBOLS,
} from "@/modules/stocks/stocks.service";

/**
 * GET  /api/watchlist  — the signed-in user's watched stocks
 * POST /api/watchlist  — { symbol } adds one (max 50)
 *
 * Unlike search and stock pages, the watchlist needs a session.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json({ data: await getWatchlist(auth.userId) });
  } catch (error) {
    console.error("[watchlist] GET error", error);
    return NextResponse.json({ error: "Error fetching watchlist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if ("error" in auth) return auth.error;

  const body = (await req.json().catch(() => null)) as { symbol?: unknown } | null;
  const symbol = typeof body?.symbol === "string" ? body.symbol : "";
  if (!symbol.trim()) {
    return NextResponse.json({ error: "A `symbol` is required" }, { status: 400 });
  }

  try {
    const result = await addToWatchlist(auth.userId, symbol);

    if (result.status === "limit_reached") {
      return NextResponse.json(
        {
          code: "WATCHLIST_LIMIT",
          error: `Your watchlist is full (${WATCHLIST_MAX_SYMBOLS} stocks). Remove one to add another.`,
        },
        { status: 400 }
      );
    }
    if (result.status === "unknown_symbol") {
      return NextResponse.json(
        { error: `${symbol.trim().toUpperCase()} is not a covered stock` },
        { status: 404 }
      );
    }

    // `already_watched` counts as success: the end state is what was asked for.
    return NextResponse.json({ data: await getWatchlist(auth.userId) }, { status: 201 });
  } catch (error) {
    console.error("[watchlist] POST error", error);
    return NextResponse.json({ error: "Error updating watchlist" }, { status: 500 });
  }
}
