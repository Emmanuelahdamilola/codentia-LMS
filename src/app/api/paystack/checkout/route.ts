// PATH: src/app/api/paystack/checkout/route.ts
import { auth }               from '@/auth'
import { prisma }             from '@/lib/prisma'
import {
  initializeTransaction,
  generateReference,
  getAmountInKobo,
  type PaystackCurrency,
}                             from '@/lib/paystack'
import { NextResponse }       from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, currency = 'NGN' } = await req.json() as {
    courseId: string
    currency?: PaystackCurrency
  }

  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  if (!['NGN', 'USD'].includes(currency)) {
    return NextResponse.json({ error: 'Currency must be NGN or USD' }, { status: 400 })
  }

  const course = await prisma.course.findUnique({
    where:  { id: courseId },
    select: { id: true, title: true, price: true, published: true },
  })
  if (!course)           return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (!course.published) return NextResponse.json({ error: 'Course not available' }, { status: 400 })

  // Free course — enrol directly, no payment needed
  if (!course.price || course.price === 0) {
    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId: session.user.id, courseId } },
      create: { userId: session.user.id, courseId },
      update: {},
    })
    return NextResponse.json({ free: true })
  }

  // Already enrolled?
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  })
  if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })

  const reference = generateReference(session.user.id, courseId)
  const amount    = getAmountInKobo(course.price, currency as PaystackCurrency)

  try {
    const checkoutUrl = await initializeTransaction({
      email:       session.user.email!,
      amount,
      currency:    currency as PaystackCurrency,
      reference,
      callbackUrl: `${APP_URL}/api/paystack/verify?reference=${reference}`,
      metadata: {
        courseId,
        userId:      session.user.id,
        courseTitle: course.title,
      },
    })

    // Store pending reference so we can verify it later
    await prisma.notification.create({
      data: {
        userId:  session.user.id,
        type:    'LIVE_CLASS_REMINDER',   // reusing type — just a holding record
        title:   `Payment pending: ${course.title}`,
        message: `ref:${reference}|courseId:${courseId}`,
        link:    null,
        read:    true,  // don't show this in bell
      },
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}