// PATH: src/lib/paystack.ts
// Paystack payment integration
// Sign up free at https://paystack.com — Nigerian business, supports NGN + USD
//
// Install: npm install paystack-node
// Or use the REST API directly (no package needed — we use fetch)
//
// Required env vars:
//   PAYSTACK_SECRET_KEY=sk_live_...   (from Paystack Dashboard → Settings → API)
//   PAYSTACK_PUBLIC_KEY=pk_live_...   (used on frontend if needed)

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? ''
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

if (!PAYSTACK_SECRET) {
  console.warn('[paystack] PAYSTACK_SECRET_KEY not set — payments disabled')
}

// Supported currencies
export type PaystackCurrency = 'NGN' | 'USD'

// Exchange rate helper — set NGN price on Course, auto-convert for USD if needed
// In practice: set course.price in USD, multiply by your NGN rate for NGN customers
export const USD_TO_NGN = Number(process.env.USD_TO_NGN_RATE ?? 1600)

export function getAmountInKobo(priceUsd: number, currency: PaystackCurrency): number {
  if (currency === 'NGN') {
    // Convert USD price to NGN, then to kobo (smallest unit)
    return Math.round(priceUsd * USD_TO_NGN * 100)
  }
  // USD — Paystack uses cents (same as Stripe)
  return Math.round(priceUsd * 100)
}

export function formatPrice(priceUsd: number, currency: PaystackCurrency): string {
  if (currency === 'NGN') {
    const ngn = priceUsd * USD_TO_NGN
    return `₦${ngn.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
  }
  return `$${priceUsd.toFixed(2)}`
}

interface InitializeParams {
  email:      string
  amount:     number        // in kobo/cents
  currency:   PaystackCurrency
  reference:  string        // unique transaction ref
  callbackUrl: string       // Paystack redirects here after payment
  metadata:   Record<string, string>
}

interface InitializeResponse {
  status:       boolean
  message:      string
  data: {
    authorization_url: string
    access_code:       string
    reference:         string
  }
}

// Step 1 — Initialize a transaction, get the checkout URL
export async function initializeTransaction(params: InitializeParams): Promise<string> {
  if (!PAYSTACK_SECRET) {
    throw new Error('Paystack is not configured. Add PAYSTACK_SECRET_KEY to .env.local')
  }

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email:        params.email,
      amount:       params.amount,
      currency:     params.currency,
      reference:    params.reference,
      callback_url: params.callbackUrl,
      metadata:     { custom_fields: [], ...params.metadata },
    }),
  })

  const data: InitializeResponse = await res.json()
  if (!data.status) throw new Error(data.message ?? 'Failed to initialize payment')

  return data.data.authorization_url
}

// Step 2 — Verify a transaction (called in webhook or callback)
interface VerifyResponse {
  status:  boolean
  message: string
  data: {
    status:    string    // 'success' | 'failed' | 'abandoned'
    reference: string
    amount:    number
    currency:  string
    metadata:  Record<string, string>
    customer:  { email: string }
  }
}

export async function verifyTransaction(reference: string): Promise<VerifyResponse['data']> {
  if (!PAYSTACK_SECRET) throw new Error('Paystack not configured')

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  })

  const data: VerifyResponse = await res.json()
  if (!data.status) throw new Error(data.message ?? 'Verification failed')

  return data.data
}

// Generate a unique transaction reference
export function generateReference(userId: string, courseId: string): string {
  const timestamp = Date.now()
  const random    = Math.random().toString(36).slice(2, 7)
  return `CDT_${userId.slice(0, 6)}_${courseId.slice(0, 6)}_${timestamp}_${random}`
}