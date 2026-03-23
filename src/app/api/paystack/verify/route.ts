// PATH: src/app/api/paystack/verify/route.ts
// Paystack redirects the student to this URL after payment with ?reference=...
// We verify with Paystack, enrol the student, then redirect to the course.

import { prisma }           from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'
import { NextResponse }      from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const reference        = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(`${APP_URL}/courses?payment=failed`)
  }

  try {
    const tx = await verifyTransaction(reference)

    if (tx.status !== 'success') {
      console.error('[paystack verify] Payment not successful:', tx.status, reference)
      return NextResponse.redirect(`${APP_URL}/courses?payment=failed`)
    }

    // Extract metadata
    const userId   = tx.metadata?.userId
    const courseId = tx.metadata?.courseId

    if (!userId || !courseId) {
      console.error('[paystack verify] Missing metadata on transaction:', reference)
      return NextResponse.redirect(`${APP_URL}/courses?payment=failed`)
    }

    // Enrol the student (idempotent)
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

    console.log(`[paystack] Enrolled user ${userId} in course ${courseId} (ref: ${reference})`)

    // Redirect student to their new course
    return NextResponse.redirect(`${APP_URL}/courses/${courseId}?enrolled=1`)
  } catch (err) {
    console.error('[paystack verify] Error:', err)
    return NextResponse.redirect(`${APP_URL}/courses?payment=failed`)
  }
}