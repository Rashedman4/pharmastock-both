/* import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  try {
    // Get subscription ID from request body
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Verify user authentication
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    // Connect to the database
    const client = await pool.connect();

    try {
      // Get subscription details with package information
      let { rows } = await client.query(
        `SELECT s.id, s.status, s.start_date, s.end_date, s.stripe_subscription_id, 
                s.current_period_start, s.current_period_end, s.cancel_at_period_end,
                p.name as package_name, p.interval, p.interval_count, p.amount
         FROM subscriptions s
         JOIN packages p ON s.package_id = p.id
         WHERE s.stripe_subscription_id = $1 AND s.user_id = (SELECT id FROM users WHERE email = $2)`,
        [subscriptionId, token.email]
      );

      if (rows.length === 0) {
        // Wait for 2 seconds
        await delay(2000);

        // Retry the query
        ({ rows } = await client.query(
          `SELECT s.id, s.status, s.start_date, s.end_date, s.stripe_subscription_id, 
                  s.current_period_start, s.current_period_end, s.cancel_at_period_end,
                  p.name as package_name, p.interval, p.interval_count, p.amount
           FROM subscriptions s
           JOIN packages p ON s.package_id = p.id
           WHERE s.stripe_subscription_id = $1 AND s.user_id = (SELECT id FROM users WHERE email = $2)`,
          [subscriptionId, token.email]
        ));

        if (rows.length === 0) {
          return NextResponse.json(
            { error: "Subscription not found" },
            { status: 404 }
          );
        }
      }
      console.log(`Rows: ${rows}`);
      if (rows.length === 0) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 }
        );
      }

      const subscription = rows[0];
      const { rows: transactionRows } = await client.query(
        `SELECT amount
         FROM transactions
         WHERE subscription_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [subscription.id]
      );

      // Extract amount or default to null if not found
      const latestTransactionAmount = transactionRows[0]?.amount || null;
      // Format dates for client
      const formattedSubscription = {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        packageName: subscription.package_name,
        interval: subscription.interval,
        intervalCount: subscription.interval_count,
        amount: subscription.amount, // This is in cents
        latestTransactionAmount,
      };

      return NextResponse.json(formattedSubscription);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
 */
