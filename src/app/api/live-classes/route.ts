// PATH: src/app/api/admin/live-classes/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, title, instructor, scheduledAt, durationMins, meetingLink } = await req.json()

  const liveClass = await prisma.liveClass.create({
    data: {
      courseId, title, instructor,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins ?? 60,
      meetingLink,
    },
    include: { course: { select: { title: true } } },
  })

  // Notify all enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map(e => ({
        userId: e.user.id,
        type: 'LIVE_CLASS_REMINDER' as const,
        title: `New live class: ${title}`,
        message: `Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        link: '/live-classes',
      })),
    })
  }

  return NextResponse.json(liveClass, { status: 201 })
}