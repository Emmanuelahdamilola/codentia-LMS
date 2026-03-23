// PATH: src/app/api/cron/reminders/route.ts
// Vercel Cron — runs every 10 minutes (see vercel.json)
// Protected by CRON_SECRET env variable

import { prisma }                       from '@/lib/prisma'
import { getPlatformSettings }          from '@/lib/settings'
import { sendLiveClassReminder,
         sendAssignmentDeadlineReminder } from '@/lib/email'
import { Resend }                        from 'resend'
import { NextResponse }                  from 'next/server'

export const dynamic = 'force-dynamic'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.RESEND_FROM_EMAIL   ?? 'noreply@codentia.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getPlatformSettings()
  const now      = new Date()
  const results  = { liveReminders: { '24h': 0, '1h': 0, '10min': 0 }, deadlines: 0, reEngagement: 0, errors: 0 }

  // ── 1. Live class reminders ─────────────────────────────────────────
  if (settings.emailLiveReminders) {
    const upcoming = await prisma.liveClass.findMany({
      where: {
        status:      'SCHEDULED',
        scheduledAt: { gte: now, lte: new Date(now.getTime() + 25 * 3_600_000) },
      },
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

    for (const cls of upcoming) {
      const minutesUntil = Math.round((cls.scheduledAt.getTime() - now.getTime()) / 60_000)
      let reminderType: '24h' | '1h' | '10min' | null = null
      if (minutesUntil >= 1435 && minutesUntil <= 1445) reminderType = '24h'
      else if (minutesUntil >= 55 && minutesUntil <= 65) reminderType = '1h'
      else if (minutesUntil >= 5  && minutesUntil <= 15) reminderType = '10min'
      if (!reminderType) continue

      for (const enrollment of cls.course.enrollments) {
        const { user } = enrollment
        try {
          await sendLiveClassReminder(user.email, user.name, cls.title, cls.scheduledAt, cls.meetingLink, reminderType)
          results.liveReminders[reminderType]++
          await prisma.notification.upsert({
            where:  { id: `${cls.id}-${user.id}-${reminderType}` },
            update: {},
            create: {
              id:      `${cls.id}-${user.id}-${reminderType}`,
              userId:  user.id,
              type:    'LIVE_CLASS_REMINDER',
              title:   reminderType === '10min' ? `Starting now: ${cls.title}`
                     : reminderType === '1h'    ? `Starting in 1 hour: ${cls.title}`
                     :                           `Class tomorrow: ${cls.title}`,
              message: `${cls.scheduledAt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} at ${cls.scheduledAt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}`,
              link:    '/live-classes',
            },
          })
        } catch (err) { results.errors++; console.error('Live reminder failed:', err) }
      }
    }
  }

  // ── 2. Assignment deadline reminders (24h before due date) ──────────
  if (settings.emailDeadlines) {
    const in24h    = new Date(now.getTime() + 24 * 3_600_000)
    const in25h    = new Date(now.getTime() + 25 * 3_600_000)

    const dueAssignments = await prisma.assignment.findMany({
      where: { dueDate: { gte: in24h, lte: in25h } },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      include: { user: { select: { id: true, name: true, email: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    for (const assignment of dueAssignments) {
      const course = assignment.lesson.module.course
      for (const enrollment of course.enrollments) {
        const { user } = enrollment
        // Skip if already submitted
        const submitted = await prisma.submission.findUnique({
          where: { userId_assignmentId: { userId: user.id, assignmentId: assignment.id } },
          select: { id: true },
        })
        if (submitted) continue

        try {
          await sendAssignmentDeadlineReminder(
            user.email, user.name, assignment.title, course.title,
            assignment.dueDate!, `${APP_URL}/assignments/${assignment.id}`
          )
          results.deadlines++
          // In-app notification
          await prisma.notification.create({
            data: {
              userId:  user.id,
              type:    'ASSIGNMENT_DEADLINE',
              title:   `Due tomorrow: ${assignment.title}`,
              message: `Don't forget — your assignment for ${course.title} is due in 24 hours.`,
              link:    `/assignments/${assignment.id}`,
            },
          })
        } catch (err) { results.errors++; console.error('Deadline reminder failed:', err) }
      }
    }
  }

  // ── 3. Re-engagement (7 days inactive) ─────────────────────────────
  if (settings.emailReEngagement && process.env.RESEND_API_KEY) {
    const sevenDaysAgo  = new Date(now.getTime() - 7  * 86_400_000)
    const eightDaysAgo  = new Date(now.getTime() - 8  * 86_400_000)

    // Students with last activity exactly 7 days ago (within an hour window)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        progressRecords: {
          none: { completedAt: { gte: sevenDaysAgo } },
          some: { completedAt: { gte: eightDaysAgo, lt: sevenDaysAgo } },
        },
        enrollments: { some: {} },
      },
      select: { id: true, name: true, email: true },
      take:   100,
    })

    for (const user of inactiveUsers) {
      try {
        await resend.emails.send({
          from:    FROM,
          to:      user.email,
          subject: `${user.name.split(' ')[0]}, your learning streak is waiting! 🔥`,
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#8A70D6,#6B52B8);padding:32px 40px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🔥</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">We miss you!</h1>
    <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">Your coding journey is waiting</p>
  </div>
  <div style="padding:40px;">
    <p style="color:#424040;font-size:16px;margin:0 0 8px;">Hi ${user.name.split(' ')[0]},</p>
    <p style="color:#424040;font-size:14px;line-height:1.6;margin:0 0 24px;">
      You haven't logged in for 7 days. Your courses are still here — pick up right where you left off!
    </p>
    <div style="background:#F0EAFF;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="color:#6B52B8;font-size:13px;margin:0;font-weight:600;">
        💡 Tip: Even 15 minutes a day keeps your streak alive and builds real skills fast.
      </p>
    </div>
    <a href="${APP_URL}/dashboard"
       style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;
              padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
      Continue Learning →
    </a>
    <p style="color:#8A8888;font-size:12px;margin:28px 0 0;">
      <a href="${APP_URL}/settings" style="color:#8A8888;">Manage notifications</a>
    </p>
  </div>
</div></body></html>`,
        })
        results.reEngagement++
        await prisma.notification.create({
          data: {
            userId:  user.id,
            type:    'LIVE_CLASS_REMINDER',
            title:   'We miss you! 🔥',
            message: 'You haven\'t logged in for 7 days. Your courses are waiting.',
            link:    '/dashboard',
          },
        })
      } catch (err) { results.errors++; console.error('Re-engagement failed:', err) }
    }
  }

  console.log('[cron] Results:', results)
  return NextResponse.json({ success: true, results, timestamp: now.toISOString() })
}