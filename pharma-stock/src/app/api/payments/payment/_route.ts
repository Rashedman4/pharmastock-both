/* import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PaymentRequest {
  productType: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get the token and extract user email
    const token = await getToken({ req });

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

    const { productType } = (await req.json()) as PaymentRequest;
    const userEmail = token.email;

    const client = await pool.connect();
    try {
      // Get price ID and other details from packages table
      const {
        rows: [package_],
      } = await client.query(
        `SELECT stripe_price_id, interval, interval_count, amount 
         FROM packages 
         WHERE stripe_price_id = $1`,
        [productType]
      );

      if (!package_) {
        return NextResponse.json(
          { error: "Invalid product type" },
          { status: 400 }
        );
      }

      // Check if this is user's first subscription
      const { rows: previousSubscriptions } = await client.query(
        `SELECT COUNT(*) as count
         FROM subscriptions 
         WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
        [userEmail]
      );
      console.log(previousSubscriptions);
      const isFirstTimeSubscriber = previousSubscriptions[0].count == 0;

      // Create or retrieve customer
      const customer = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      let customerId = customer.data[0]?.id;

      if (!customerId) {
        const newCustomer = await stripe.customers.create({ email: userEmail });
        customerId = newCustomer.id;
      }
      console.log("Is first-time subscriber:", isFirstTimeSubscriber);
      console.log("Using coupon ID:", await createOrRetrieveFirstTimeCoupon());

      // Create a subscription with a trial period for the first payment
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: package_.stripe_price_id }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        // Apply 50% discount for first-time subscribers
        discounts: isFirstTimeSubscriber
          ? [
              {
                coupon: await createOrRetrieveFirstTimeCoupon(),
              },
            ]
          : undefined,
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          productType,
          userEmail,
          isFirstTimeSubscription: isFirstTimeSubscriber.toString(),
        },
      });

      // Get the client secret from the subscription's invoice
      const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        subscriptionId: stripeSubscription.id,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Subscription processing failed" },
      { status: 500 }
    );
  }
}

// Helper function to create or retrieve the first-time subscriber coupon
async function createOrRetrieveFirstTimeCoupon() {
  const COUPON_ID = "FIRST_TIME_50_OFF";

  try {
    // Try to retrieve existing coupon
    const existingCoupon = await stripe.coupons.retrieve(COUPON_ID);
    return existingCoupon.id;
  } catch (error) {
    // Create new coupon if it doesn't exist
    console.log(error);
    const coupon = await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: 50,
      duration: "once",
      name: "50% Off First Bill",
    });
    return coupon.id;
  }
}
 */
