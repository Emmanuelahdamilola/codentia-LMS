// PATH: src/app/api/paystack/webhook/route.ts
// Paystack sends POST to this URL for every event.
// Configure in Paystack Dashboard → Settings → API → Webhooks
// Webhook URL: https://yourdomain.com/api/paystack/webhook
//
// This is a belt-and-suspenders backup — the /verify route handles
// the primary enrolment. The webhook catches cases where the student
// closes the browser before the verify redirect completes.

import { prisma }    from '@/lib/prisma'
import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('x-paystack-signature')
  const secret    = process.env.PAYSTACK_SECRET_KEY

  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  // Verify webhook signature
  const hash = createHmac('sha512', secret).update(body).digest('hex')
  if (hash !== signature) {
    console.error('[paystack webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const data     = event.data
    const userId   = data.metadata?.userId
    const courseId = data.metadata?.courseId

    if (!userId || !courseId) {
      console.error('[paystack webhook] Missing metadata:', data.metadata)
      return NextResponse.json({ received: true })
    }

    // Enrol (idempotent — safe to run even if verify already did it)
    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    })

    console.log(`[paystack webhook] Enrolled ${userId} in ${courseId}`)
  }

  return NextResponse.json({ received: true })
}