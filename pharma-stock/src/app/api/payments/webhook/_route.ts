/* import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import pool from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing signature or webhook secret", {
      status: 402,
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Add debug logging
    console.log("Webhook signature verified successfully");
    console.log("Event type:", event.type);

    const client = await pool.connect();
    try {
      switch (event.type) {
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const stripeSubscriptionId = invoice.subscription as string;

          if (stripeSubscriptionId) {
            // Fetch the subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(
              stripeSubscriptionId
            );
            const customerId = subscription.customer as string;
            const customer = await stripe.customers.retrieve(customerId);
            const customerEmail = (customer as Stripe.Customer).email;

            if (!customerEmail) {
              throw new Error("Customer email not found");
            }
            // Get the price ID and discount information
            const priceId = subscription.items.data[0]?.price.id;
            const discounts = invoice.discounts || [];
            const hasDiscount = discounts.length > 0;

            // Calculate original and discounted amounts
            console.log(invoice);
            const originalAmount = invoice.subtotal;
            const discountAmount = originalAmount - invoice.amount_paid;
            const finalAmount = invoice.amount_paid;
            // Get package details
            const {
              rows: [package_],
            } = await client.query(
              `SELECT id, interval, interval_count 
               FROM packages 
               WHERE stripe_price_id = $1`,
              [priceId]
            );

            if (!package_) {
              throw new Error(`Package not found for price ID: ${priceId}`);
            }

            // Calculate end date
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + package_.interval_count);

            // Start a transaction
            await client.query("BEGIN");

            try {
              // Create subscription record
              const {
                rows: [newSubscription],
              } = await client.query(
                `INSERT INTO subscriptions (
                  user_id,
                  package_id,
                  status,
                  start_date,
                  end_date,
                  stripe_subscription_id,
                  stripe_customer_id,
                  current_period_start,
                  current_period_end
                ) VALUES (
                  (SELECT id FROM users WHERE email = $1),
                  $2,
                  $3,
                  NOW(),
                  $4,
                  $5,
                  $6,
                  to_timestamp($7),
                  to_timestamp($8)
                ) RETURNING id, user_id`,
                [
                  customerEmail,
                  package_.id,
                  subscription.status,
                  endDate,
                  subscription.id,
                  customerId,
                  subscription.current_period_start,
                  subscription.current_period_end,
                ]
              );

              // If there's a discount, record it
              if (hasDiscount) {
                const firstDiscount = discounts[0];
                const couponId =
                  typeof firstDiscount === "object" && "coupon" in firstDiscount
                    ? firstDiscount.coupon?.id
                    : null;

                await client.query(
                  `INSERT INTO subscription_discounts (
                    user_id,
                    subscription_id,
                    discount_type,
                    discount_amount,
                    original_amount,
                    stripe_coupon_id
                  ) VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    newSubscription.user_id,
                    newSubscription.id,
                    "first_time",
                    discountAmount,
                    originalAmount,
                    couponId,
                  ]
                );
              }
              console.log(`Has Discount : ${hasDiscount}`);
              console.log(`discounts : ${discounts}`);

              // Record the transaction
              await client.query(
                `INSERT INTO transactions (
                  user_id,
                  subscription_id,
                  stripe_invoice_id,
                  stripe_payment_intent_id,
                  amount,
                  original_amount,
                  discount_amount,
                  is_first_subscription,
                  currency,
                  status,
                  payment_method,
                  metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                  newSubscription.user_id,
                  newSubscription.id,
                  invoice.id,
                  invoice.payment_intent,
                  finalAmount,
                  originalAmount,
                  discountAmount,
                  hasDiscount,
                  invoice.currency,
                  invoice.status,
                  "card",
                  JSON.stringify(invoice),
                ]
              );

              await client.query("COMMIT");
            } catch (error) {
              await client.query("ROLLBACK");
              throw error;
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          // Keep existing update logic
          const subscription = event.data.object as Stripe.Subscription;

          // Only update if the subscription exists in our database
          const { rows } = await client.query(
            `SELECT id FROM subscriptions WHERE stripe_subscription_id = $1`,
            [subscription.id]
          );

          if (rows.length > 0) {
            await client.query(
              `UPDATE subscriptions 
               SET status = $1, 
                   end_date = $2,
                   current_period_start = to_timestamp($3),
                   current_period_end = to_timestamp($4),
                   cancel_at_period_end = $5
               WHERE stripe_subscription_id = $6`,
              [
                subscription.status,
                new Date(subscription.current_period_end * 1000),
                subscription.current_period_start,
                subscription.current_period_end,
                subscription.cancel_at_period_end,
                subscription.id,
              ]
            );

            if (subscription.canceled_at) {
              await client.query(
                `UPDATE subscriptions 
                 SET canceled_at = to_timestamp($1)
                 WHERE stripe_subscription_id = $2`,
                [subscription.canceled_at, subscription.id]
              );
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          // Keep existing deletion logic
          const subscription = event.data.object as Stripe.Subscription;
          await client.query(
            `UPDATE subscriptions 
             SET status = 'canceled',
                 ended_at = NOW()
             WHERE stripe_subscription_id = $1`,
            [subscription.id]
          );
          break;
        }

        case "invoice.payment_failed": {
          // Only handle payment failures for existing subscriptions
          const invoice = event.data.object as Stripe.Invoice;
          const stripeSubscriptionId = invoice.subscription as string;

          if (stripeSubscriptionId) {
            const { rows: subscriptionRows } = await client.query(
              `SELECT id, user_id FROM subscriptions WHERE stripe_subscription_id = $1`,
              [stripeSubscriptionId]
            );

            if (subscriptionRows.length > 0) {
              const { id: subscriptionId, user_id: userId } =
                subscriptionRows[0];

              await client.query(
                `UPDATE subscriptions 
                 SET status = 'past_due'
                 WHERE id = $1`,
                [subscriptionId]
              );

              // Record the failed transaction
              if (invoice.payment_intent) {
                await client.query(
                  `INSERT INTO transactions (
                    user_id,
                    subscription_id,
                    stripe_invoice_id,
                    stripe_payment_intent_id,
                    amount,
                    currency,
                    status,
                    payment_method,
                    metadata
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                  [
                    userId,
                    subscriptionId,
                    invoice.id,
                    invoice.payment_intent,
                    invoice.amount_due,
                    invoice.currency,
                    "failed",
                    "card",
                    JSON.stringify(invoice),
                  ]
                );
              }
            }
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return new NextResponse("Webhook processed successfully", {
        status: 200,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    // Add more detailed error logging
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      console.error("Signature verification failed:", {
        payload: payload.slice(0, 100), // Log first 100 chars of payload
        signature: sig,
      });
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Unknown error",
      { status: 400 }
    );
  }
}
 */
