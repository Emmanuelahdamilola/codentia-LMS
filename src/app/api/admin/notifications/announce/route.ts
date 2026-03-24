// PATH: src/app/api/admin/notifications/announce/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse }  from 'next/server'
import nodemailer       from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function parseFrom(raw: string) {
  if (!raw) return 'Codentia <noreply@gmail.com>'
  if (raw.includes('<') && raw.includes('>')) return raw
  const lastSpace = raw.lastIndexOf(' ')
  if (lastSpace > 0) {
    const name = raw.slice(0, lastSpace).trim()
    const email = raw.slice(lastSpace + 1).trim()
    if (email.includes('@')) return `${name} <${email}>`
  }
  return raw
}

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
  const FROM = parseFrom(process.env.EMAIL_FROM ?? '')
  await transporter.sendMail({ from: FROM, to, subject, html })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { target, subject, message, sendEmail, sendInApp } = await req.json()

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 })
  }

  // ── Resolve recipient users ──────────────────────────────
  let users: { id: string; name: string; email: string }[] = []

  if (target === 'all' || !target) {
    users = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, email: true } })
  } else if (target === 'atrisk') {
    const risky = await prisma.quizResult.groupBy({
      by: ['userId'], _avg: { score: true },
      having: { score: { _avg: { lt: 60 } } },
    })
    users = await prisma.user.findMany({
      where: { id: { in: risky.map(r => r.userId) }, role: 'STUDENT' },
      select: { id: true, name: true, email: true },
    })
  } else {
    // Course keyword targets: 'html', 'js', 'react'
    const keyword = target === 'html' ? 'HTML' : target === 'js' ? 'JavaScript' : target === 'react' ? 'React' : target
    const course  = await prisma.course.findFirst({ where: { title: { contains: keyword, mode: 'insensitive' } } })
    if (course) {
      const enrolments = await prisma.enrollment.findMany({
        where: { courseId: course.id }, include: { user: { select: { id: true, name: true, email: true } } },
      })
      users = enrolments.map(e => e.user)
    }
  }

  if (!users.length) return NextResponse.json({ error: 'No matching students found' }, { status: 400 })

  // ── In-app notifications ─────────────────────────────────
  let inAppSent = 0
  if (sendInApp !== false) {
    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id, type: 'LIVE_CLASS_REMINDER' as const,
        title: subject, message, link: null,
      })),
      skipDuplicates: true,
    })
    inAppSent = users.length
  }

  // ── Emails via Nodemailer (sent individually — Gmail rate limits batch) ──
  let emailSent = 0
  if (sendEmail !== false && process.env.EMAIL_USER) {
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:#8A70D6;padding:28px 40px;"><h1 style="color:#fff;margin:0;font-size:20px;">Codentia</h1></div>
  <div style="padding:40px;">
    <h2 style="color:#424040;font-size:18px;margin:0 0 16px;">\${subject}</h2>
    <div style="color:#424040;font-size:14px;line-height:1.6;white-space:pre-line;">\${message}</div>
    <p style="margin:32px 0 0;"><a href="\${APP_URL}" style="color:#8A70D6;font-size:13px;">Visit Codentia →</a></p>
  </div>
</div></body></html>`
    for (const user of users) {
      try {
        await sendMail(user.email, subject, html)
        emailSent++
      } catch (err) { console.error('Email failed for', user.email, err) }
    }
  }

  return NextResponse.json({ success: true, inAppSent, emailSent, totalUsers: users.length })
}