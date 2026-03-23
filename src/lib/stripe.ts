// PATH: src/lib/stripe.ts
// Run: npm install stripe @stripe/stripe-js
// Required env vars:
//   STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
//   STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
//   STRIPE_WEBHOOK_SECRET=whsec_...

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — payments disabled')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null

export const CURRENCY = 'usd'

// Create a Stripe Checkout session for course purchase
export async function createCheckoutSession({
  courseId, courseTitle, priceUsd, userId, userEmail, successUrl, cancelUrl,
}: {
  courseId:    string
  courseTitle: string
  priceUsd:    number      // e.g. 29.99
  userId:      string
  userEmail:   string
  successUrl:  string
  cancelUrl:   string
}): Promise<string> {
  if (!stripe) throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local')

  const session = await stripe.checkout.sessions.create({
    mode:               'payment',
    payment_method_types: ['card'],
    customer_email:     userEmail,
    line_items: [{
      price_data: {
        currency:     CURRENCY,
        product_data: {
          name:        courseTitle,
          description: `Full access to ${courseTitle} on Codentia`,
          metadata:    { courseId },
        },
        unit_amount:  Math.round(priceUsd * 100), // cents
      },
      quantity: 1,
    }],
    metadata: { courseId, userId },
    success_url: successUrl,
    cancel_url:  cancelUrl,
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Failed to create checkout session')
  return session.url
}