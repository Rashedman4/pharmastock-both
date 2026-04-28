import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { ProgramService } from "@/modules/program/program.service";

export const runtime = "nodejs";
const service = new ProgramService();

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_PROGRAM_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse("Missing Stripe webhook configuration", {
      status: 400,
    });
  }

  const payload = await request.text();

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as any;
        if (session?.metadata?.program_type === "ELITE_FIRM_PROFIT") {
          await service.finalizeFirmProfitPaymentFromStripe(session.id, session);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as any;
        if (session?.metadata?.program_type === "ELITE_FIRM_PROFIT") {
          await service.expireFirmProfitPaymentFromStripe(session.id, session);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Program Stripe webhook failed:", error);
    return new NextResponse(error?.message || "Webhook error", { status: 400 });
  }
}
