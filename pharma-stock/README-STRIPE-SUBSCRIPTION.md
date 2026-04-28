# Stripe Subscription Integration Guide

This guide explains how to set up and use the Stripe subscription integration for recurring payments.

## Overview

The integration allows users to subscribe to different plans (3 months, 6 months, 1 year) with recurring payments. It supports both card payments and Apple Pay.

## Setup Steps

### 1. Database Migration

Run the database migration to update the schema:

```bash
# From the project root
npx ts-node src/lib/db/run-migration.ts
```

### 2. Stripe Account Setup

1. Create a Stripe account if you don't have one already
2. Get your API keys from the Stripe dashboard:
   - Secret key (for server-side)
   - Publishable key (for client-side)

### 3. Environment Variables

Add the following environment variables to your `.env` file:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Create Stripe Products and Prices

Run the setup script to create products and prices in Stripe:

```bash
npx ts-node src/lib/stripe/setup-products.ts
```

This will create:

- A product for your subscription
- Three prices for different subscription intervals (3 months, 6 months, 1 year)

### 5. Update Packages Table

After creating the products and prices, update your packages table with the Stripe price IDs:

```bash
# First, add the price IDs to your .env file
STRIPE_PRICE_3_MONTHS=price_...
STRIPE_PRICE_6_MONTHS=price_...
STRIPE_PRICE_1_YEAR=price_...

# Then run the update script
npx ts-node src/lib/db/update-packages.ts
```

### 6. Webhook Setup

1. Use the Stripe CLI to test webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

2. For production, set up a webhook endpoint in the Stripe dashboard pointing to:

   ```
   https://your-domain.com/api/payments/webhook
   ```

3. Make sure to subscribe to the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

## Testing

To test the subscription flow:

1. Use Stripe test cards:

   - `4242 4242 4242 4242` for successful payments
   - `4000 0000 0000 9995` for failed payments

2. Check the Stripe dashboard to verify that subscriptions are created

3. Verify that the database is updated correctly

## Troubleshooting

- If webhooks aren't working, check the Stripe dashboard for failed webhook attempts
- Verify that your webhook secret is correct
- Check the server logs for any errors
- Make sure your database schema is up to date

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
