// PATH: src/app/api/courses/enrolled/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          category: true,
          published: true,
          thumbnail: true,
          _count: { select: { enrollments: true } },
          modules: {
            include: { lessons: { select: { id: true } } },
          },
        },
      },
    },
  })

  // Calculate progress for each enrolled course
  const result = await Promise.all(
    enrollments.map(async ({ course }) => {
      const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
      const totalLessons = allLessonIds.length

      const completedCount = totalLessons > 0
        ? await prisma.progressRecord.count({
            where: { userId, lessonId: { in: allLessonIds } },
          })
        : 0

      const progress = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0

      return {
        id:         course.id,
        title:      course.title,
        slug:       course.slug,
        difficulty: course.difficulty,
        category:   course.category,
        published:  course.published,
        thumbnail:  course.thumbnail,
        _count:     course._count,
        progress,
      }
    })
  )

  return NextResponse.json(result)
}