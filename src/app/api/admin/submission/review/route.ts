// PATH: src/app/api/admin/submissions/review/route.ts
import { auth }                from '@/auth'
import { prisma }              from '@/lib/prisma'
import { sendGradeNotification } from '@/lib/email'
import { NextResponse }        from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { submissionId, grade, feedback } = await req.json()
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
  if (grade === undefined || grade === null) return NextResponse.json({ error: 'grade required' }, { status: 400 })
  if (!feedback?.trim()) return NextResponse.json({ error: 'feedback required' }, { status: 400 })

  const gradeNum = Math.min(100, Math.max(0, Number(grade)))

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data:  { grade: gradeNum, feedback, status: 'GRADED', reviewedAt: new Date() },
    include: {
      user:       { select: { id: true, name: true, email: true } },
      assignment: { include: { lesson: { include: { module: { select: { courseId: true } } } } } },
    },
  })

  // In-app notification
  await prisma.notification.create({
    data: {
      userId:  submission.user.id,
      type:    'ASSIGNMENT_FEEDBACK',
      title:   `Assignment graded: ${submission.assignment.title}`,
      message: `You scored ${gradeNum}/100. Check your feedback.`,
      link:    `/assignments/${submission.assignment.id}`,
    },
  })

  // Grade email via Nodemailer (non-fatal)
  sendGradeNotification(
    submission.user.email,
    submission.user.name,
    submission.assignment.title,
    gradeNum,
    feedback,
    `${APP_URL}/assignments/${submission.assignment.id}`
  ).catch(err => console.error('[grade email]', err))

  return NextResponse.json({ success: true, grade: gradeNum })
}