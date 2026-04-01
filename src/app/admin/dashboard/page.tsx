// PATH: src/app/admin/dashboard/page.tsx
// Server component — all DB queries here. No framer-motion.
import { prisma }  from '@/lib/prisma'
import type { Metadata } from 'next'
import AdminDashboardView from '@/components/admin/AdminDashboardView'
import type { AdminDashboardViewProps } from '@/components/admin/AdminDashboardView'

export const metadata: Metadata = { title: 'Admin Dashboard — Codentia' }

export default async function AdminDashboardPage() {
  const now        = new Date()
  const weekAgo    = new Date(now.getTime() - 7  * 86_400_000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try { return await fn() }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes("Can't reach database") || msg.includes('connect')) {
        await new Promise(r => setTimeout(r, 3000))
        return fn()
      }
      throw err
    }
  }

  const [
    totalStudents,
    activeStudents,
    pendingSubmissions,
    liveClassesThisMonth,
    recentSubmissionsRaw,
    upcomingClassesRaw,
    recentEnrollmentsRaw,
    quizResults,
    topStudentsRaw,
  ] = await withRetry(() => Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', progressRecords: { some: { completedAt: { gte: weekAgo } } } } }),
    prisma.submission.count({ where: { status: { in: ['PENDING', 'AI_REVIEWED'] } } }),
    prisma.liveClass.count({ where: { scheduledAt: { gte: monthStart } } }),

    prisma.submission.findMany({
      where:   { status: { in: ['PENDING', 'AI_REVIEWED'] } },
      orderBy: { submittedAt: 'desc' },
      take:    5,
      include: {
        user:       { select: { name: true } },
        assignment: { select: { id: true, title: true } },
      },
    }),

    prisma.liveClass.findMany({
      where:   { scheduledAt: { gte: now }, status: { not: 'CANCELLED' } },
      orderBy: { scheduledAt: 'asc' },
      take:    3,
      include: { course: { select: { title: true } } },
    }),

    prisma.enrollment.findMany({
      orderBy: { enrolledAt: 'desc' },
      take:    6,
      include: { user: { select: { name: true } }, course: { select: { title: true } } },
    }),

    prisma.quizResult.findMany({ select: { score: true } }),

    prisma.user.findMany({
      where:   { role: 'STUDENT' },
      include: { _count: { select: { progressRecords: true, quizResults: true } } },
      orderBy: { progressRecords: { _count: 'desc' } },
      take:    5,
    }),
  ]))

  // ── Derived values ──────────────────────────────────────────
  const buckets = { a: 0, b: 0, c: 0, d: 0 }
  for (const q of quizResults) {
    if      (q.score >= 90) buckets.a++
    else if (q.score >= 70) buckets.b++
    else if (q.score >= 60) buckets.c++
    else                    buckets.d++
  }
  const avgQuiz = quizResults.length
    ? Math.round(quizResults.reduce((s, q) => s + q.score, 0) / quizResults.length)
    : 0

  const aiInsight = `JavaScript course has a low completion rate — ${buckets.d} students scored below 60% on recent quizzes. Consider reviewing Lesson 3 on closures. ${activeStudents} students were active in the last 7 days — a strong engagement rate.`

  // ── Serialise (no Date objects across boundary) ─────────────
  const recentEnrollments: AdminDashboardViewProps['recentEnrollments'] = recentEnrollmentsRaw.map(e => ({
    userName:    e.user.name ?? 'Unknown',
    courseTitle: e.course.title,
    enrolledAt:  e.enrolledAt.toISOString(),
  }))

  const recentSubmissions: AdminDashboardViewProps['recentSubmissions'] = recentSubmissionsRaw.map(s => ({
    id:              s.id,
    status:          s.status,
    assignmentTitle: s.assignment.title,
    userName:        s.user.name ?? 'Unknown',
  }))

  const topStudents: AdminDashboardViewProps['topStudents'] = topStudentsRaw.map(s => ({
    id:      s.id,
    name:    s.name ?? 'Unknown',
    lessons: s._count.progressRecords,
  }))

  const upcomingClasses: AdminDashboardViewProps['upcomingClasses'] = upcomingClassesRaw.map(c => ({
    id:           c.id,
    title:        c.title,
    courseTitle:  c.course.title,
    scheduledAt:  c.scheduledAt.toISOString(),
    status:       c.status,
  }))

  return (
    <AdminDashboardView
      totalStudents={totalStudents}
      activeStudents={activeStudents}
      pendingSubmissions={pendingSubmissions}
      liveClassesThisMonth={liveClassesThisMonth}
      recentEnrollments={recentEnrollments}
      recentSubmissions={recentSubmissions}
      topStudents={topStudents}
      upcomingClasses={upcomingClasses}
      avgQuiz={avgQuiz}
      buckets={buckets}
      aiInsight={aiInsight}
      nowMs={now.getTime()}
    />
  )
}