// PATH: src/app/api/admin/submissions/review/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { Resend }       from 'resend'
import { NextResponse } from 'next/server'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.RESEND_FROM_EMAIL   ?? 'noreply@codentia.dev'
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
      assignment: { select: { id: true, title: true } },
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

  // Email notification (non-fatal if it fails)
  if (process.env.RESEND_API_KEY) {
    const scoreColor = gradeNum >= 80 ? '#22C55E' : gradeNum >= 60 ? '#F59E0B' : '#EF4444'
    resend.emails.send({
      from: FROM, to: submission.user.email,
      subject: `Assignment graded: ${submission.assignment.title}`,
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:#8A70D6;padding:28px 40px;"><h1 style="color:#fff;margin:0;font-size:20px;">Codentia</h1></div>
  <div style="padding:40px;">
    <p style="color:#424040;margin:0 0 8px;">Hi ${submission.user.name},</p>
    <h2 style="color:#424040;font-size:18px;margin:0 0 24px;">Your assignment has been graded!</h2>
    <div style="background:#F0EAFF;border-left:4px solid #8A70D6;border-radius:4px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#424040;font-weight:600;margin:0 0 4px;font-size:16px;">${submission.assignment.title}</p>
      <p style="font-size:28px;font-weight:900;color:${scoreColor};margin:8px 0 0;">${gradeNum}/100</p>
    </div>
    <h3 style="color:#424040;font-size:15px;margin:0 0 12px;">Instructor Feedback</h3>
    <div style="color:#424040;font-size:14px;line-height:1.6;white-space:pre-line;background:#F9F9F9;border-radius:8px;padding:16px;">${feedback}</div>
    <p style="margin:32px 0 0;">
      <a href="${APP_URL}/assignments/${submission.assignment.id}"
         style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">
        View Assignment →
      </a>
    </p>
  </div>
  <div style="border-top:1px solid #E9E3FF;padding:20px 40px;text-align:center;">
    <p style="color:#8A8888;font-size:12px;margin:0;">© ${new Date().getFullYear()} Codentia</p>
  </div>
</div></body></html>`,
    }).catch(err => console.error('Grade email failed:', err))
  }

  return NextResponse.json({ success: true, grade: gradeNum })
}