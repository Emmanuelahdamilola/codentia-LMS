// PATH: src/app/api/stripe/checkout/route.ts
import { auth }                  from '@/auth'
import { prisma }                from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/stripe'
import { NextResponse }          from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const course = await prisma.course.findUnique({
    where:  { id: courseId },
    select: { id: true, title: true, price: true, published: true },
  })
  if (!course)           return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (!course.published) return NextResponse.json({ error: 'Course not available' }, { status: 400 })

  // Free course — enrol directly
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

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const checkoutUrl = await createCheckoutSession({
      courseId,
      courseTitle: course.title,
      priceUsd:    course.price,
      userId:      session.user.id,
      userEmail:   session.user.email!,
      successUrl:  `${APP_URL}/courses/${courseId}?enrolled=1`,
      cancelUrl:   `${APP_URL}/courses/${courseId}`,
    })
    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}