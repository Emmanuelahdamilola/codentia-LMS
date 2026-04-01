// PATH: src/app/(dashboard)/dashboard/page.tsx
// Server component — fetches all data, passes plain serialisable props to the
// client component DashboardView which owns all framer-motion animations.

import { auth }                from '@/auth'
import { redirect }            from 'next/navigation'
import { prisma }              from '@/lib/prisma'
import { getAllCourseProgress } from '@/lib/progress'
import type { Metadata }       from 'next'
import DashboardView           from '@/components/dashboard/DashboardView'
import type { DashboardViewProps } from '@/components/dashboard/DashboardView'

export const metadata: Metadata = { title: 'Dashboard — Codentia' }

export default async function DashboardPage() {
  // ── Auth guard ──────────────────────────────────────────
  const session = await auth()
  if (!session) redirect('/login')

  const userId    = session.user.id
  const firstName = session.user.name?.split(' ')[0] ?? 'there'
  const now       = new Date()

  // ── Parallel data fetch ─────────────────────────────────
  const [
    progressList,
    quizzesPassed,
    pendingCount,
    attendedCount,
    upcomingClasses,
    exploreCourses,
    enrolledRows,
    submittedAssignmentIds,
    weekProgress,
    streakRecords,
  ] = await Promise.all([
    getAllCourseProgress(userId),

    prisma.quizResult.count({
      where: { userId, score: { gte: 60 } },
    }),

    prisma.submission.count({
      where: { userId, status: 'PENDING' },
    }),

    prisma.liveClassAttendance.count({
      where: { userId },
    }),

    prisma.liveClass.findMany({
      where: {
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 2,
      select: {
        id:           true,
        title:        true,
        instructor:   true,
        meetingLink:  true,
        scheduledAt:  true,
        durationMins: true,
        status:       true,
        course:       { select: { title: true } },
      },
    }),

    prisma.course.findMany({
      where:   { published: true },
      orderBy: { createdAt: 'desc' },
      take:    3,
      select: {
        id:         true,
        title:      true,
        difficulty: true,
        modules: {
          select: { _count: { select: { lessons: true } } },
        },
      },
    }),

    prisma.enrollment.findMany({
      where:   { userId },
      orderBy: { enrolledAt: 'desc' },
      take:    4,
      select: {
        enrolledAt: true,
        course: {
          select: {
            id:         true,
            title:      true,
            difficulty: true,
            modules: {
              orderBy: { order: 'asc' },
              select: {
                id:    true,
                title: true,
                order: true,
                lessons: {
                  select:  { id: true, order: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    }),

    prisma.submission.findMany({
      where:  { userId },
      select: { assignmentId: true },
    }),

    prisma.progressRecord.count({
      where: {
        userId,
        completedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),

    prisma.progressRecord.findMany({
      where: {
        userId,
        completedAt: { gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      },
      select:  { completedAt: true },
      orderBy: { completedAt: 'desc' },
    }),
  ])

  // ── Derived values ──────────────────────────────────────
  const lessonsCompleted = progressList.reduce((sum, p) => sum + p.completedLessons, 0)

  const assignmentsDone = await prisma.submission.count({
    where: {
      userId,
      status: { in: ['GRADED', 'INSTRUCTOR_REVIEWED', 'AI_REVIEWED'] },
    },
  })

  let streak = 0
  const completionDays = new Set(streakRecords.map(r => r.completedAt.toDateString()))
  for (let offset = 0; offset <= 60; offset++) {
    const day = new Date(now)
    day.setDate(now.getDate() - offset)
    if (completionDays.has(day.toDateString())) {
      streak++
    } else if (offset > 0) {
      break
    }
  }

  const enrolledCourseIds = enrolledRows.map(e => e.course.id)
  const submittedIds      = new Set(submittedAssignmentIds.map(s => s.assignmentId))

  // ── Upcoming assignments (not yet submitted) ────────────
  const courseIds = enrolledRows.map(e => e.course.id)
  const upcomingAssignments = courseIds.length > 0
    ? await prisma.assignment.findMany({
        where: {
          lesson: { module: { courseId: { in: courseIds } } },
          ...(submittedIds.size > 0 ? { id: { notIn: [...submittedIds] } } : {}),
          OR: [{ dueDate: { gte: now } }, { dueDate: null }],
        },
        orderBy: [{ dueDate: 'asc' }],
        take:    3,
        select: {
          id:      true,
          title:   true,
          dueDate: true,
          lesson: {
            select: {
              module: { select: { course: { select: { title: true } } } },
            },
          },
        },
      })
    : []

  // ── Stats config (iconKey instead of JSX — icons rendered client-side) ──
  const stats: DashboardViewProps['stats'] = [
    {
      iconKey:     'lessons',
      colorClass:  'bg-[#EDE8FF] text-[#7C5CDB]',
      value:       lessonsCompleted,
      label:       'Lessons completed',
      change:      `↑ ${weekProgress} this week`,
      changeColor: '#16A34A',
    },
    {
      iconKey:     'quizzes',
      colorClass:  'bg-[#DCFCE7] text-[#16A34A]',
      value:       quizzesPassed,
      label:       'Quizzes passed',
      change:      '↑ avg 82%',
      changeColor: '#16A34A',
    },
    {
      iconKey:     'assignments',
      colorClass:  'bg-[#FEF3C7] text-[#D97706]',
      value:       assignmentsDone,
      label:       'Assignments done',
      change:      `${pendingCount} pending`,
      changeColor: '#F59E0B',
    },
    {
      iconKey:     'live',
      colorClass:  'bg-[#DBEAFE] text-[#2563EB]',
      value:       attendedCount,
      label:       'Live classes attended',
      change:      upcomingClasses.length > 0 ? 'Next: Tonight' : 'None scheduled',
      changeColor: '#7C5CDB',
    },
  ]

  const activeProgress = progressList.find(p => p.percentage > 0 && p.percentage < 100)
  const welcomeSub = activeProgress
    ? `Continue your ${activeProgress.courseTitle} journey — you're ${activeProgress.percentage}% through.`
    : enrolledRows.length > 0
      ? "You have courses waiting — let's keep the momentum going!"
      : 'Start your first course and begin your coding journey!'
  const continueHref = activeProgress ? `/courses/${activeProgress.courseId}` : '/courses'

  // ── Serialise Dates to ISO strings (Next.js server→client boundary) ──
  const serialisedClasses = upcomingClasses.map(c => ({
    ...c,
    scheduledAt: c.scheduledAt.toISOString(),
  }))
  const serialisedEnrolled = enrolledRows.map(e => ({
    ...e,
    enrolledAt: e.enrolledAt.toISOString(),
  }))
  const serialisedAssignments = upcomingAssignments.map(a => ({
    ...a,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
  }))
  const classDates      = upcomingClasses.map(c => c.scheduledAt.toISOString())
  const assignmentDates = upcomingAssignments
    .filter(a => a.dueDate)
    .map(a => a.dueDate!.toISOString())

  return (
    <DashboardView
      firstName={firstName}
      streak={streak}
      weekProgress={weekProgress}
      welcomeSub={welcomeSub}
      continueHref={continueHref}
      stats={stats}
      exploreCourses={exploreCourses}
      enrolledCourseIds={enrolledCourseIds}
      enrolledRows={serialisedEnrolled}
      progressList={progressList}
      upcomingClasses={serialisedClasses}
      upcomingAssignments={serialisedAssignments}
      classDates={classDates}
      assignmentDates={assignmentDates}
      nowMs={now.getTime()}
    />
  )
}