// PATH: src/app/api/cron/reminders/route.ts
// Vercel Cron — runs every 10 minutes (see vercel.json)
// Protected by CRON_SECRET env variable

import { prisma }                       from '@/lib/prisma'
import { getPlatformSettings }          from '@/lib/settings'
import { sendLiveClassReminder,
         sendAssignmentDeadlineReminder,
         sendReEngagementEmail }         from '@/lib/email'
import { NextResponse }                  from 'next/server'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authHeader = req.headers.get('authorization')
  const querySecret = searchParams.get('secret')
  const cronSecret  = process.env.CRON_SECRET

  // Support both: Authorization: Bearer <secret>  AND  ?secret=<secret>
  // If CRON_SECRET is not set, reject in production, allow in dev
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET env var not set' }, { status: 401 })
    }
    // Allow in development without secret
  } else {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized — wrong secret' }, { status: 401 })
    }
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
  if (settings.emailReEngagement && process.env.EMAIL_USER) {
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
        await sendReEngagementEmail(user.email, user.name)
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