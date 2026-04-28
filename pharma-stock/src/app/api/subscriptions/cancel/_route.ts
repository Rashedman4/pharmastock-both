/* import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Get the token and extract user email
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    if (!token.email) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      // Get user's active subscription
      const { rows: subscriptionRows } = await client.query(
        `SELECT s.id, s.stripe_subscription_id, s.status, s.cancel_at_period_end
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         WHERE u.email = $1 AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [token.email]
      );

      if (subscriptionRows.length === 0) {
        return NextResponse.json(
          { error: "No active subscription found" },
          { status: 404 }
        );
      }

      const subscription = subscriptionRows[0];

      // If already scheduled for cancellation, return success
      if (subscription.cancel_at_period_end) {
        return NextResponse.json({
          message: "Subscription already scheduled for cancellation",
          cancelAtPeriodEnd: true,
        });
      }

      // Cancel the subscription at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      // Update the subscription in the database
      await client.query(
        `UPDATE subscriptions
         SET cancel_at_period_end = true
         WHERE id = $1`,
        [subscription.id]
      );

      return NextResponse.json({
        message: "Subscription scheduled for cancellation at period end",
        cancelAtPeriodEnd: true,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
 */
