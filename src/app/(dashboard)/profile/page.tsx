// PATH: src/app/(dashboard)/profile/page.tsx
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import { getAllCourseProgress } from '@/lib/progress'
import { getInitials } from '@/lib/utils'
import type { Metadata } from 'next'
import ProfileClient from '@/components/dashboard/ProfileClient'

export const metadata: Metadata = { title: 'Profile — Codentia' }

export default async function ProfilePage() {
  const session = await auth()
  const userId  = session!.user.id
  const now     = new Date()

  const [user, progressList, quizzesPassed, submissionsDone, attendedCount, streakRecords] =
    await Promise.all([
      prisma.user.findUnique({
        where:  { id: userId },
        select: { name: true, email: true, bio: true, image: true, timezone: true, createdAt: true },
      }),
      getAllCourseProgress(userId),
      prisma.quizResult.count({ where: { userId, score: { gte: 60 } } }),
      prisma.submission.count({ where: { userId, status: { in: ['GRADED','INSTRUCTOR_REVIEWED','AI_REVIEWED'] } } }),
      prisma.liveClassAttendance.count({ where: { userId } }),
      prisma.progressRecord.findMany({
        where:  { userId, completedAt: { gte: new Date(now.getTime() - 60 * 86_400_000) } },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
      }),
    ])

  if (!user) return null

  // Streak calc
  const completionDays = new Set(streakRecords.map(r => r.completedAt.toDateString()))
  let streak = 0
  for (let offset = 0; offset <= 60; offset++) {
    const day = new Date(now); day.setDate(now.getDate() - offset)
    if (completionDays.has(day.toDateString())) streak++
    else if (offset > 0) break
  }

  const lessonsCompleted = progressList.reduce((s, p) => s + p.completedLessons, 0)
  const initials         = getInitials(user.name)

  const enrolledCourses = progressList.map(p => ({
    courseId:    p.courseId,
    courseTitle: p.courseTitle,
    percentage:  p.percentage,
  }))

  return (
    <ProfileClient
      user={{
        name:        user.name,
        email:       user.email,
        bio:         user.bio ?? '',
        timezone:    user.timezone,
        memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        initials,
        image:       user.image ?? null,
      }}
      stats={{
        lessonsCompleted,
        quizzesPassed,
        assignmentsDone:  submissionsDone,
        liveAttended:     attendedCount,
        streak,
      }}
      enrolledCourses={enrolledCourses}
    />
  )
}
