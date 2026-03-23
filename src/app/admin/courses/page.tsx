// PATH: src/app/admin/courses/page.tsx
import { prisma }         from '@/lib/prisma'
import type { Metadata }  from 'next'
import AdminCoursesClient from '@/components/admin/AdminCoursesClient'

export const metadata: Metadata = { title: 'Courses — Admin' }

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count:  { select: { modules: true, enrollments: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { select: { id: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  })

  const allQuizResults = await prisma.quizResult.findMany({
    select: { score: true, quiz: { select: { lesson: { select: { module: { select: { courseId: true } } } } } } },
  })
  const quizMap: Record<string, { sum: number; count: number }> = {}
  for (const q of allQuizResults) {
    const cid = q.quiz.lesson.module.courseId
    if (!quizMap[cid]) quizMap[cid] = { sum: 0, count: 0 }
    quizMap[cid].sum   += q.score
    quizMap[cid].count += 1
  }

  const progressData = await Promise.all(courses.map(async c => {
    const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0)
    const completedLessons = totalLessons > 0
      ? await prisma.progressRecord.count({ where: { lesson: { module: { courseId: c.id } } } })
      : 0
    const avgProgress = c._count.enrollments > 0 && totalLessons > 0
      ? Math.round(completedLessons / (c._count.enrollments * totalLessons) * 100) : 0
    const lessonIds = c.modules.flatMap(m => m.lessons.map(l => l.id))
    const fullyCompleted = lessonIds.length > 0
      ? (await prisma.progressRecord.groupBy({
          by: ['userId'],
          where: { lessonId: { in: lessonIds } },
          _count: { lessonId: true },
          having: { lessonId: { _count: { gte: lessonIds.length } } },
        })).length
      : 0
    return { courseId: c.id, avgProgress, fullyCompleted }
  }))
  const progressMap = Object.fromEntries(progressData.map(p => [p.courseId, p]))

  const [publishedCount, draftCount, totalEnrolled] = await Promise.all([
    prisma.course.count({ where: { published: true } }),
    prisma.course.count({ where: { published: false } }),
    prisma.enrollment.count(),
  ])
  const avgQuizAll = allQuizResults.length > 0
    ? Math.round(allQuizResults.reduce((s, q) => s + q.score, 0) / allQuizResults.length) : 0

  const rows = courses.map(c => ({
    id:            c.id,
    title:         c.title,
    description:   c.description,
    difficulty:    c.difficulty,
    published:     c.published,
    thumbnail:     c.thumbnail,
    price:         (c as any).price ?? 0,
    moduleCount:   c._count.modules,
    lessonCount:   c.modules.reduce((s, m) => s + m.lessons.length, 0),
    enrolled:      c._count.enrollments,
    avgQuiz:       quizMap[c.id] ? Math.round(quizMap[c.id].sum / quizMap[c.id].count) : null,
    avgProgress:   progressMap[c.id]?.avgProgress   ?? 0,
    fullyCompleted:progressMap[c.id]?.fullyCompleted ?? 0,
    createdAt:     c.createdAt.toISOString(),
    modules:       c.modules.map(m => ({
      id:          m.id,
      title:       m.title,
      lessonCount: m.lessons.length,
    })),
  }))

  return (
    <AdminCoursesClient
      courses={rows}
      stats={{ publishedCount, draftCount, totalEnrolled, avgQuiz: avgQuizAll }}
    />
  )
}