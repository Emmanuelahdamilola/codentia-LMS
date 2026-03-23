// PATH: src/app/api/admin/live-classes/[id]/recording/route.ts
// Called after admin uploads recording to R2 — saves the public URL to the DB
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id }          = await params
  const { recordingUrl } = await req.json()

  if (!recordingUrl) {
    return NextResponse.json({ error: 'recordingUrl required' }, { status: 400 })
  }

  const liveClass = await prisma.liveClass.update({
    where: { id },
    data:  { recordingUrl },
  })

  // Notify enrolled students that recording is ready
  const enrollments = await prisma.enrollment.findMany({
    where:   { courseId: liveClass.courseId },
    include: { user: { select: { id: true } } },
  })

  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map(e => ({
        userId:  e.user.id,
        type:    'NEW_LESSON' as const,
        title:   `Recording ready: ${liveClass.title}`,
        message: 'The recording from your live class is now available.',
        link:    '/live-classes',
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ success: true, recordingUrl })
}