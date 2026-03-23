// PATH: src/app/api/admin/submissions/review/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { submissionId, grade, feedback } = await req.json()

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade: Number(grade),
      feedback,
      status: grade !== undefined && grade !== null ? 'GRADED' : 'INSTRUCTOR_REVIEWED',
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true } },
      assignment: { select: { title: true, id: true } },
    },
  })

  await prisma.notification.create({
    data: {
      userId: submission.user.id,
      type: 'ASSIGNMENT_FEEDBACK',
      title: 'Assignment graded!',
      message: `Your submission for "${submission.assignment.title}" received ${grade}/100.`,
      link: `/assignments/${submission.assignment.id}`,
    },
  })

  return NextResponse.json({ success: true })
}