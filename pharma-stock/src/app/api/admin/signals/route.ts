import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import { createNotificationForAll } from "@/lib/services/notification.service";

// Function to fetch current price (replace with your actual API call)
async function fetchCurrentPrice(symbol: string) {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${process.env.MY_API_KEY}`
    );
    const data = await response.json();
    return data[0].price;
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }
}

// Shared close-and-archive logic used by both DELETE (admin manually closing a
// signal) and the auto-close path below (a signal whose target was hit while
// refreshing prices). Uses pool.query directly (auto-acquire/release per call)
// rather than a manually-managed client, so it can never operate on a client
// that's already been returned to the pool.
async function closeSignalAndArchive(id: number) {
  const signalResult = await pool.query("SELECT * FROM signals WHERE id = $1", [id]);
  if (signalResult.rowCount === 0) return null;

  const signal = signalResult.rows[0];
  const success = signal.enter_price < signal.price_now;
  const historyQuery = `
    INSERT INTO signal_history (symbol, entrance_date, closing_date, in_price, out_price, success, reason_en, reason_ar)
    VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)
  `;
  await pool.query(historyQuery, [
    signal.symbol,
    signal.date_opened,
    signal.enter_price,
    signal.price_now,
    success,
    signal.reason_en,
    signal.reason_ar,
  ]);

  await pool.query("DELETE FROM signals WHERE id = $1", [id]);

  return { signal, success };
}
export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authorized emails
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      symbol,
      enterPrice,
      firstTarget,
      secondTarget,
      reason_en,
      reason_ar,
    } = body;

    // Try to fetch current price first
    let currentPrice;
    try {
      currentPrice = await fetchCurrentPrice(symbol);
    } catch (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Invalid symbol or unable to fetch current price" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // A symbol can only have one open signal at a time — signals only ever
    // holds currently-open rows (closing one deletes it here and inserts
    // into signal_history instead).
    const existing = await client.query(
      `SELECT id FROM signals WHERE UPPER(symbol) = UPPER($1) LIMIT 1`,
      [symbol]
    );
    if (existing.rows.length > 0) {
      client.release();
      return NextResponse.json(
        { error: `A signal for ${symbol} is already open.` },
        { status: 409 }
      );
    }

    const query = `
      INSERT INTO signals (symbol, type, enter_price, price_now, first_target, second_target, reason_en,reason_ar)
      VALUES ($1, $2, $3, $4, $5, $6, $7,$8)
      RETURNING *;
    `;
    let result;
    try {
      result = await client.query(query, [
        symbol,
        "Buy",
        enterPrice,
        currentPrice,
        firstTarget,
        secondTarget,
        reason_en,
        reason_ar,
      ]);
    } catch (insertError: any) {
      client.release();
      // DB-level safety net (unique index on UPPER(symbol)) in case of a
      // race with another request between the check above and this insert.
      if (insertError?.code === "23505") {
        return NextResponse.json(
          { error: `A signal for ${symbol} is already open.` },
          { status: 409 }
        );
      }
      throw insertError;
    }
    client.release();

    // Revalidate the customer-facing signals route
    revalidatePath("/api/signals");

    const newSignal = result.rows[0];
    try {
      await createNotificationForAll({
        type: "signal_open",
        title_en: `New Idea: ${symbol}`,
        title_ar: `فكرة جديدة: ${symbol}`,
        body_en: `New investment idea opened for ${symbol}`,
        body_ar: `تم فتح فكرة استثمارية جديدة لـ ${symbol}`,
        data: { signalId: newSignal.id, symbol, action: "Buy", screen: "signals" },
      });
    } catch (notifErr) {
      console.error("[Notification] Failed to send signal_open notification:", notifErr);
    }

    return NextResponse.json(newSignal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding signal. error: " + error },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authorized emails
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      id,
      symbol,
      type,
      enterPrice,
      priceNow,
      firstTarget,
      secondTarget,
      reason_en,
      reason_ar,
    } = await req.json();
    const client = await pool.connect();
    const query = `
      UPDATE signals
      SET symbol = $1, type = $2, enter_price = $3, price_now = $4, first_target = $5, second_target = $6, reason_en=$7,reason_ar=$8
      WHERE id = $9
      RETURNING *;
    `;
    const result = await client.query(query, [
      symbol,
      type,
      enterPrice,
      priceNow,
      firstTarget,
      secondTarget,
      reason_en,
      reason_ar,
      id,
    ]);
    client.release();
    revalidatePath("/api/signals");

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating signal, error: " + error },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authorized emails
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, closeSignal } = body;

    if (closeSignal === "yes") {
      const closed = await closeSignalAndArchive(id);
      if (!closed) {
        return NextResponse.json({ error: "Signal not found" }, { status: 404 });
      }

      revalidatePath("/api/signals");
      revalidatePath("/api/signalHistory");

      const { signal, success } = closed;
      try {
        await createNotificationForAll({
          type: "signal_close",
          title_en: `Idea Closed: ${signal.symbol}`,
          title_ar: `إغلاق فكرة: ${signal.symbol}`,
          body_en: `${signal.symbol} idea closed ${success ? "successfully" : "with a loss"}`,
          body_ar: `تم إغلاق فكرة ${signal.symbol} ${success ? "بنجاح" : "بخسارة"}`,
          data: {
            symbol: signal.symbol,
            success,
            in_price: signal.enter_price,
            out_price: signal.price_now,
            screen: "signals",
          },
        });
      } catch (notifErr) {
        console.error("[Notification] Failed to send signal_close notification:", notifErr);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    const signalResult = await pool.query(
      "SELECT id FROM signals WHERE id = $1",
      [id]
    );
    if (signalResult.rowCount === 0) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM signals WHERE id = $1", [id]);
    revalidatePath("/api/signals");
    revalidatePath("/api/signalHistory");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/admin/signals] Error:", error);
    return NextResponse.json(
      { error: "Error deleting signal. Error: " + error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //const isAdmin = session?.user?.email === "rashed111222@yahoo.com";
  const email = token?.email;
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  const isAdmin = authorizedEmails.includes(email || "");

  try {
    const result = await pool.query(`SELECT * FROM signals`);

    if (isAdmin) {
      // Update prices and check targets for each signal
      const updatedSignals = await Promise.all(
        result.rows.map(async (signal) => {
          const currentPrice = await fetchCurrentPrice(signal.symbol);
          // Update the price first (same as before), so that if this signal
          // is about to be archived, the archived record reflects the fresh
          // price rather than the stale pre-refresh one.
          const updateResult = await pool.query(
            `UPDATE signals SET price_now = $1 WHERE id = $2 RETURNING *;`,
            [currentPrice, signal.id]
          );

          if (currentPrice >= signal.first_target) {
            // Target reached — archive to signal_history and remove from
            // signals, same as an admin manually closing it via DELETE.
            const closed = await closeSignalAndArchive(signal.id);
            if (closed) {
              const { signal: closedSignal, success } = closed;
              try {
                await createNotificationForAll({
                  type: "signal_close",
                  title_en: `Idea Closed: ${closedSignal.symbol}`,
                  title_ar: `إغلاق فكرة: ${closedSignal.symbol}`,
                  body_en: `${closedSignal.symbol} idea closed ${success ? "successfully" : "with a loss"}`,
                  body_ar: `تم إغلاق فكرة ${closedSignal.symbol} ${success ? "بنجاح" : "بخسارة"}`,
                  data: {
                    symbol: closedSignal.symbol,
                    success,
                    in_price: closedSignal.enter_price,
                    out_price: closedSignal.price_now,
                    screen: "signals",
                  },
                });
              } catch (notifErr) {
                console.error("[Notification] Failed to send signal_close notification:", notifErr);
              }
            }
            return null; // Signal closed, don't include in the response
          } else {
            return updateResult.rows[0];
          }
        })
      );

      // Filter out null values (closed signals)
      const activeSignals = updatedSignals.filter((signal) => signal !== null);
      return NextResponse.json(activeSignals, { status: 200 });
    } else {
      // For non-admin users, just return the signals without updating
      return NextResponse.json(result.rows, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching signals, error: " + error },
      { status: 500 }
    );
  }
}
