// PATH: src/app/admin/students/page.tsx
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import AdminStudentsClient from '@/components/admin/AdminStudentsClient'

export const metadata: Metadata = { title: 'Students — Admin' }

export default async function AdminStudentsPage() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)

  // ── All students with counts ──────────────────────────────
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          enrollments: true,
          progressRecords: true,
          quizResults: true,
          submissions: true,
        },
      },
      enrollments: {
        include: { course: { select: { id: true, title: true } } },
        take: 4,
      },
    },
  })

  // ── Avg quiz score per student ────────────────────────────
  const allQuizResults = await prisma.quizResult.findMany({
    select: {
      userId: true, score: true, completedAt: true,
      quiz: { select: { title: true } }
    },
    orderBy: { completedAt: 'desc' },
  })

  const scoreMap: Record<string, { sum: number; count: number; recent: { title: string; score: number }[] }> = {}
  for (const q of allQuizResults) {
    if (!scoreMap[q.userId]) scoreMap[q.userId] = { sum: 0, count: 0, recent: [] }
    scoreMap[q.userId].sum += q.score
    scoreMap[q.userId].count += 1
    if (scoreMap[q.userId].recent.length < 3) {
      scoreMap[q.userId].recent.push({ title: q.quiz.title, score: q.score })
    }
  }

  // ── Submission counts per student (submitted/total) ───────
  const submissionMap: Record<string, { submitted: number }> = {}
  const allSubmissions = await prisma.submission.findMany({
    select: { userId: true },
  })
  for (const s of allSubmissions) {
    if (!submissionMap[s.userId]) submissionMap[s.userId] = { submitted: 0 }
    submissionMap[s.userId].submitted += 1
  }

  // ── Total assignments per course per student ──────────────
  // We approximate totalAssignments as count of assignments in enrolled courses
  const assignmentCounts = await prisma.assignment.findMany({
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  })
  const assignmentsPerCourse: Record<string, number> = {}
  for (const a of assignmentCounts) {
    const cid = a.lesson.module.courseId
    assignmentsPerCourse[cid] = (assignmentsPerCourse[cid] ?? 0) + 1
  }

  // ── Last activity per student ─────────────────────────────
  const lastActivity = await prisma.progressRecord.findMany({
    select: { userId: true, completedAt: true },
    orderBy: { completedAt: 'desc' },
  })
  const lastActiveMap: Record<string, Date> = {}
  for (const r of lastActivity) {
    if (!lastActiveMap[r.userId]) lastActiveMap[r.userId] = r.completedAt
  }

  // ── Live class attendance per student ─────────────────────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const liveAttendance = await prisma.liveClassAttendance.findMany({
    where: { joinedAt: { gte: monthStart } },
    select: { userId: true },
  })
  const attendanceMap: Record<string, number> = {}
  for (const a of liveAttendance) {
    attendanceMap[a.userId] = (attendanceMap[a.userId] ?? 0) + 1
  }
  const totalLiveThisMonth = await prisma.liveClass.count({
    where: { scheduledAt: { gte: monthStart }, status: { in: ['COMPLETED', 'LIVE'] } },
  })

  // ── Top-level stats ───────────────────────────────────────
  const [totalStudents, newThisMonth, activeThisWeek] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', createdAt: { gte: monthStart } } }),
    prisma.user.count({
      where: { role: 'STUDENT', progressRecords: { some: { completedAt: { gte: weekAgo } } } },
    }),
  ])

  // ── Build rows ────────────────────────────────────────────
  const rows = students.map(s => {
    const sm = scoreMap[s.id]
    const avgQuiz = sm ? Math.round(sm.sum / sm.count) : null
    const recent = sm?.recent ?? []
    const lastAct = lastActiveMap[s.id]
    const daysAgo = lastAct ? Math.floor((now.getTime() - lastAct.getTime()) / 86_400_000) : null

    const totalAssignments = s.enrollments.reduce(
      (acc, e) => acc + (assignmentsPerCourse[e.courseId] ?? 0), 0
    )
    const submitted = submissionMap[s.id]?.submitted ?? 0

   const status: 'active' | 'at-risk' | 'inactive' | 'completed' =
  s._count.enrollments > 0 &&
  s._count.progressRecords > 0 &&
  avgQuiz !== null &&
  avgQuiz >= 85
    ? 'completed'
    : s._count.progressRecords === 0
      ? 'inactive'
      : avgQuiz !== null && avgQuiz < 55
        ? 'at-risk'
        : daysAgo !== null && daysAgo > 6
          ? 'inactive'
          : 'active'

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      courses: s.enrollments.map(e => ({ id: e.courseId, title: e.course.title })),
      courseCount: s._count.enrollments,
      progress: s._count.progressRecords,
      quizCount: s._count.quizResults,
      avgQuiz,
      recentQuizzes: recent,
      lastActive: daysAgo,
      status,
      assignmentsLabel: `${submitted}/${totalAssignments}`,
      liveAttended: attendanceMap[s.id] ?? 0,
      totalLive: totalLiveThisMonth,
      createdAt: s.createdAt.toISOString(),
    }
  })

  const atRiskCount = rows.filter(r => r.status === 'at-risk').length
  const completedCount = rows.filter(r => r.status === 'completed').length

  return (
    <AdminStudentsClient
      students={rows}
      stats={{ totalStudents, newThisMonth, activeThisWeek, atRiskCount, completedCount }}
    />
  )
}