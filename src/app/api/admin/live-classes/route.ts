// PATH: src/app/api/admin/live-classes/route.ts
import { auth }                from '@/auth'
import { prisma }              from '@/lib/prisma'
import { sendLiveClassReminder } from '@/lib/email'
import { NextResponse }        from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, title, instructor, scheduledAt, durationMins, meetingLink } = await req.json()

  if (!courseId || !title || !scheduledAt || !meetingLink) {
    return NextResponse.json(
      { error: 'courseId, title, scheduledAt and meetingLink are required' },
      { status: 400 }
    )
  }

  const liveClass = await prisma.liveClass.create({
    data: {
      courseId,
      title,
      instructor:   instructor ?? 'Codentia Team',
      scheduledAt:  new Date(scheduledAt),
      durationMins: durationMins ?? 60,
      meetingLink,
    },
    include: { course: { select: { title: true } } },
  })

  // Notify all enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where:   { courseId },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  // In-app notifications
  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map(e => ({
        userId:  e.user.id,
        type:    'LIVE_CLASS_REMINDER' as const,
        title:   `New live class: ${title}`,
        message: `Scheduled for ${new Date(scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        link:    '/live-classes',
      })),
    })
  }

  // Confirmation emails (first notice — cron handles 24h/1h/10min reminders)
  const emailErrors: string[] = []
  if (process.env.EMAIL_USER) {
    for (const enrollment of enrollments) {
      try {
        await sendLiveClassReminder(
          enrollment.user.email,
          enrollment.user.name,
          title,
          new Date(scheduledAt),
          meetingLink,
          '24h'
        )
      } catch (err) {
        emailErrors.push(`${enrollment.user.email}: ${err}`)
        console.error('Email send failed:', err)
      }
    }
  }

  return NextResponse.json({
    ...liveClass,
    emailsSent:  enrollments.length - emailErrors.length,
    emailErrors: emailErrors.length,
  }, { status: 201 })
}