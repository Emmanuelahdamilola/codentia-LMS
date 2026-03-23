// PATH: src/app/api/admin/live-classes/[id]/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { sendLiveClassReminder } from '@/lib/email'
import { NextResponse }  from 'next/server'

interface Params { params: Promise<{ id: string }> }

// PATCH — update status (end class, cancel class)
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body   = await req.json()
  const { status, recordingUrl } = body

  const validStatuses = ['LIVE', 'COMPLETED', 'CANCELLED', 'SCHEDULED']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (status)       updateData.status       = status
  if (recordingUrl) updateData.recordingUrl = recordingUrl

  const liveClass = await prisma.liveClass.update({
    where:   { id },
    data:    updateData,
    include: {
      course: {
        include: {
          enrollments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  })

  // If cancelled → notify enrolled students
  if (status === 'CANCELLED') {
    const enrollments = liveClass.course.enrollments

    // In-app notifications
    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map(e => ({
          userId:  e.user.id,
          type:    'LIVE_CLASS_REMINDER' as const,
          title:   `Class cancelled: ${liveClass.title}`,
          message: `The live class scheduled for ${new Date(liveClass.scheduledAt).toLocaleDateString()} has been cancelled.`,
          link:    '/live-classes',
        })),
      })
    }
  }

  return NextResponse.json({ success: true, status: liveClass.status })
}

// DELETE — hard delete a cancelled class (admin only)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.liveClass.delete({ where: { id } })
  return NextResponse.json({ success: true })
}