import { prisma } from '@/lib/prisma'
import { CourseProgress } from '@/types'

/**
 * Calculate course completion % for a student
 * Formula: (completedLessons / totalLessons) × 100
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
  })

  if (!course) return null

  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
  const totalLessons = allLessonIds.length

  if (totalLessons === 0) {
    return {
      courseId,
      courseTitle: course.title,
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
    }
  }

  const completedCount = await prisma.progressRecord.count({
    where: {
      userId,
      lessonId: { in: allLessonIds },
    },
  })

  return {
    courseId,
    courseTitle: course.title,
    totalLessons,
    completedLessons: completedCount,
    percentage: Math.round((completedCount / totalLessons) * 100),
  }
}

/**
 * Get all course progress for a student
 */
export async function getAllCourseProgress(userId: string): Promise<CourseProgress[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  })

  return Promise.all(
    enrollments.map(e => getCourseProgress(userId, e.courseId))
  ).then(results => results.filter((r): r is CourseProgress => r !== null))
}

/**
 * Mark a lesson as complete and return updated progress
 */
export async function markLessonComplete(
  userId: string,
  lessonId: string
): Promise<void> {
  await prisma.progressRecord.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  })
}

/**
 * Check if AI study recommendations should be triggered (score < 60%)
 */
export async function shouldTriggerAIRecommendation(
  userId: string,
  quizId: string
): Promise<boolean> {
  const result = await prisma.quizResult.findFirst({
    where: { userId, quizId },
    orderBy: { completedAt: 'desc' },
  })
  return result ? result.score < 60 : false
}