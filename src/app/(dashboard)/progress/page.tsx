// PATH: src/app/(dashboard)/progress/page.tsx
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import { getAllCourseProgress } from '@/lib/progress'
import type { Metadata } from 'next'
import ProgressClient from '@/components/dashboard/ProgressClient'

export const metadata: Metadata = { title: 'My Progress — Codentia' }

export default async function ProgressPage() {
  const session = await auth()
  const userId  = session!.user.id
  const now     = new Date()

  const [progressList, quizResults, passedQuizzes, submissionsDone, attendedCount, recentActivity, streakRecords] =
    await Promise.all([
      getAllCourseProgress(userId),

      // All quiz results for chart
      prisma.quizResult.findMany({
        where:   { userId },
        orderBy: { completedAt: 'asc' },
        select:  { score: true, completedAt: true, quizId: true, quiz: { select: { title: true, lesson: { select: { module: { select: { course: { select: { title: true } } } } } } } } },
      }),

      prisma.quizResult.count({ where: { userId, score: { gte: 60 } } }),
      prisma.submission.count({ where: { userId } }),
      prisma.liveClassAttendance.count({ where: { userId } }),

      // Recent 10 activity items
      prisma.progressRecord.findMany({
        where:   { userId },
        orderBy: { completedAt: 'desc' },
        take:    10,
        include: { lesson: { include: { module: { include: { course: { select: { title: true } } } } } } },
      }),

      // Last 28 days for heatmap
      prisma.progressRecord.findMany({
        where:  { userId, completedAt: { gte: new Date(now.getTime() - 28 * 86_400_000) } },
        select: { completedAt: true },
      }),
    ])

  // Streak
  const completionDays = new Set(streakRecords.map(r => r.completedAt.toDateString()))
  let streak = 0
  for (let offset = 0; offset <= 28; offset++) {
    const day = new Date(now); day.setDate(now.getDate() - offset)
    if (completionDays.has(day.toDateString())) streak++
    else if (offset > 0) break
  }

  const lessonsCompleted = progressList.reduce((s, p) => s + p.completedLessons, 0)

  // Heatmap — count completions per day in last 28 days
  const countMap = new Map<string, number>()
  streakRecords.forEach(r => {
    const key = r.completedAt.toDateString()
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  })
  const heatmapData: number[] = []
  for (let d = 27; d >= 0; d--) {
    const day = new Date(now); day.setDate(now.getDate() - d)
    const cnt = countMap.get(day.toDateString()) ?? 0
    heatmapData.push(Math.min(4, cnt)) // 0-4 intensity
  }

  // Per-module progress
  const modulesData = await prisma.module.findMany({
    where:   { course: { enrollments: { some: { userId } } } },
    orderBy: [{ course: { createdAt: 'asc' } }, { order: 'asc' }],
    include: {
      course:  { select: { id: true, title: true } },
      lessons: { select: { id: true } },
    },
  })
  const completedSet = new Set(recentActivity.map(r => r.lesson.id))
  // Need all completed lessons
  const allCompleted = await prisma.progressRecord.findMany({ where: { userId }, select: { lessonId: true } })
  const allCompletedSet = new Set(allCompleted.map(r => r.lessonId))

  const modulesWithPct = modulesData.map(m => ({
    id:         m.id,
    title:      m.title,
    courseId:   m.course.id,
    courseTitle: m.course.title,
    pct: m.lessons.length > 0
      ? Math.round(m.lessons.filter(l => allCompletedSet.has(l.id)).length / m.lessons.length * 100)
      : 0,
  }))

  return (
    <ProgressClient
      stats={{ lessonsCompleted, quizzesPassed: passedQuizzes, quizzesTotal: quizResults.length, assignmentsDone: submissionsDone, liveAttended: attendedCount, streak }}
      progressList={progressList.map(p => ({ courseId: p.courseId, courseTitle: p.courseTitle, pct: p.percentage, done: p.completedLessons, total: p.totalLessons }))}
      quizResults={quizResults.map(q => ({ score: q.score, title: q.quiz.title, courseTitle: q.quiz.lesson.module.course.title, date: q.completedAt.toISOString() }))}
      recentActivity={recentActivity.map(r => ({ id: r.id, lessonTitle: r.lesson.title, courseTitle: r.lesson.module.course.title, completedAt: r.completedAt.toISOString() }))}
      heatmapData={heatmapData}
      modulesWithPct={modulesWithPct}
    />
  )
}
