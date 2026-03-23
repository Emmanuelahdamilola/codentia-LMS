// PATH: src/app/admin/assignments/page.tsx
import { prisma }                from '@/lib/prisma'
import type { Metadata }         from 'next'
import AdminAssignmentsClient    from '@/components/admin/AdminAssignmentsClient'

export const metadata: Metadata = { title: 'Assignments — Admin' }

export default async function AdminAssignmentsPage() {
  const now      = new Date()
  const weekAgo  = new Date(now.getTime() - 7 * 86_400_000)

  const submissions = await prisma.submission.findMany({
    orderBy: [{ submittedAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          lesson: {
            include: {
              module: {
                include: { course: { select: { id: true, title: true } } },
              },
            },
          },
        },
      },
    },
  })

  const reviewedThisWeek = submissions.filter(
    s => s.status !== 'PENDING' && s.reviewedAt && s.reviewedAt >= weekAgo
  ).length

  const rows = submissions.map(s => {
    const daysAgo = Math.floor((now.getTime() - s.submittedAt.getTime()) / 86_400_000)
    const dueDate = s.assignment.dueDate
    const isLate  = dueDate ? s.submittedAt > dueDate : false

    return {
      id:             s.id,
      studentName:    s.user.name,
      studentEmail:   s.user.email,
      assignmentTitle: s.assignment.title,
      courseTitle:    s.assignment.lesson.module.course.title,
      githubUrl:      s.githubUrl,
      liveUrl:        s.liveUrl,
      notes:          s.notes,
      status:         s.status,       // PENDING | GRADED | AI_REVIEWED | RETURNED
      grade:          s.grade,
      feedback:       s.feedback,
      submittedAt:    s.submittedAt.toISOString(),
      daysAgo,
      isLate,
    }
  })

  const pending  = rows.filter(r => r.status === 'PENDING').length
  const reviewed = rows.filter(r => r.status !== 'PENDING').length
  const late     = rows.filter(r => r.isLate).length

  return (
    <AdminAssignmentsClient
      submissions={rows}
      stats={{ pending, reviewed, late, reviewedThisWeek }}
    />
  )
}