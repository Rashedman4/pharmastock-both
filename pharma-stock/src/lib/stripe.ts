import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function toStripeUnitAmount(amount: number) {
  const cents = Math.round(Number(amount || 0) * 100);
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error("Invalid Stripe payment amount.");
  }
  return cents;
}
