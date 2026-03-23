// PATH: src/app/api/stripe/webhook/route.ts
// Configure in Stripe Dashboard: Endpoint URL = https://yourdomain.com/api/stripe/webhook
// Events to listen for: checkout.session.completed

import { prisma }       from '@/lib/prisma'
import { stripe }       from '@/lib/stripe'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  const secret    = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing stripe-signature or webhook secret' }, { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as any
    const userId   = session.metadata?.userId   as string | undefined
    const courseId = session.metadata?.courseId as string | undefined

    if (!userId || !courseId) {
      console.error('[stripe webhook] Missing metadata:', session.metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    if (session.payment_status === 'paid') {
      // Enrol the student
      await prisma.enrollment.upsert({
        where:  { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
      })

      // In-app notification
      const course = await prisma.course.findUnique({
        where: { id: courseId }, select: { title: true },
      })
      await prisma.notification.create({
        data: {
          userId,
          type:    'NEW_LESSON',
          title:   `You're enrolled: ${course?.title ?? 'Course'}`,
          message: 'Your payment was successful. Start learning now!',
          link:    `/courses/${courseId}`,
        },
      })

      console.log(`[stripe] Enrolled user ${userId} in course ${courseId}`)
    }
  }

  return NextResponse.json({ received: true })
}