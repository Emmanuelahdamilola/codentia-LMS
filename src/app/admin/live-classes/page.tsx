// PATH: src/app/admin/live-classes/page.tsx
import { prisma }        from '@/lib/prisma'
import type { Metadata } from 'next'
import AdminLiveClient   from '@/components/admin/AdminLiveClient'

export const metadata: Metadata = { title: 'Live Classes — Admin' }

export default async function AdminLiveClassesPage() {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [courses, liveClasses, monthlyClasses] = await Promise.all([
    prisma.course.findMany({
      where:   { published: true },
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    prisma.liveClass.findMany({
      orderBy: { scheduledAt: 'desc' },
      take:    30,
      include: {
        course:     { select: { title: true } },
        _count:     { select: { attendance: true } },
      },
    }),
    prisma.liveClass.findMany({
      where:  { scheduledAt: { gte: monthStart } },
      select: {
        id: true, status: true, recordingUrl: true,
        _count: { select: { attendance: true } },
      },
    }),
  ])

  // ── Monthly stats ─────────────────────────────────────────
  const classesHeld      = monthlyClasses.filter(c => c.status === 'COMPLETED').length
  const totalAttendees   = monthlyClasses.reduce((s, c) => s + c._count.attendance, 0)
  const avgAttendance    = classesHeld > 0 ? Math.round(totalAttendees / classesHeld) : 0
  const attendanceRate   = monthlyClasses.length > 0
    ? Math.round((classesHeld / monthlyClasses.length) * 100)
    : 0
  const recordingsReady  = monthlyClasses.filter(c => c.recordingUrl).length

  // ── Per-session attendance for mini chart (last 8 completed) ──
  const completedSorted = liveClasses
    .filter(c => c.status === 'COMPLETED')
    .slice(0, 8)
    .reverse()
  const attendanceChart = completedSorted.map(c => c._count.attendance)

  // ── Is anything live right now? ───────────────────────────
  const liveNow = liveClasses.find(c => c.status === 'LIVE') ?? null

  const rows = liveClasses.map(c => ({
    id:           c.id,
    title:        c.title,
    courseTitle:  c.course.title,
    instructor:   c.instructor,
    scheduledAt:  c.scheduledAt.toISOString(),
    durationMins: c.durationMins,
    status:       c.status,
    meetingLink:  c.meetingLink,
    recordingUrl: c.recordingUrl,
    attendance:   c._count.attendance,
  }))

  return (
    <AdminLiveClient
      courses={courses}
      classes={rows}
      liveNow={liveNow ? {
        id:          liveNow.id,
        title:       liveNow.title,
        courseTitle: liveNow.course.title,
        meetingLink: liveNow.meetingLink,
        attendance:  liveNow._count.attendance,
      } : null}
      monthlyStats={{
        classesHeld, totalAttendees, avgAttendance,
        attendanceRate, recordingsReady,
        totalThisMonth: monthlyClasses.length,
        attendanceChart,
      }}
    />
  )
}