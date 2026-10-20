import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/modules/program/route-helpers";
import { removeFromWatchlist, setWatchAlerts } from "@/modules/stocks/stocks.service";

/**
 * DELETE /api/watchlist/[symbol]  — unwatch
 * PATCH  /api/watchlist/[symbol]  — { alerts_enabled: boolean }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const auth = await getAuthUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { symbol } = await params;
    const removed = await removeFromWatchlist(auth.userId, symbol);
    if (!removed) {
      return NextResponse.json(
        { error: `${symbol.toUpperCase()} is not on your watchlist` },
        { status: 404 }
      );
    }

    return NextResponse.json({ symbol: symbol.toUpperCase(), watched: false });
  } catch (error) {
    console.error("[watchlist/:symbol] DELETE error", error);
    return NextResponse.json({ error: "Error updating watchlist" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const auth = await getAuthUser(req);
  if ("error" in auth) return auth.error;

  const body = (await req.json().catch(() => null)) as {
    alerts_enabled?: unknown;
  } | null;
  if (typeof body?.alerts_enabled !== "boolean") {
    return NextResponse.json(
      { error: "`alerts_enabled` must be true or false" },
      { status: 400 }
    );
  }

  try {
    const { symbol } = await params;
    const updated = await setWatchAlerts(auth.userId, symbol, body.alerts_enabled);
    if (!updated) {
      return NextResponse.json(
        { error: `${symbol.toUpperCase()} is not on your watchlist` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      alerts_enabled: body.alerts_enabled,
    });
  } catch (error) {
    console.error("[watchlist/:symbol] PATCH error", error);
    return NextResponse.json({ error: "Error updating watchlist" }, { status: 500 });
  }
}
