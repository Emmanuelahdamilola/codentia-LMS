// PATH: src/app/admin/assignments/page.tsx
import { prisma }             from '@/lib/prisma'
import type { Metadata }      from 'next'
import AdminAssignmentsClient from '@/components/admin/AdminAssignmentsClient'

export const metadata: Metadata = { title: 'Assignments — Admin' }

export default async function AdminAssignmentsPage() {
  const now     = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)

  // ── Submissions (for review tab) ────────────────────────────
  const submissions = await prisma.submission.findMany({
    orderBy: [{ submittedAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          lesson: {
            include: {
              module: { include: { course: { select: { id: true, title: true } } } },
            },
          },
        },
      },
    },
  })

  const reviewedThisWeek = submissions.filter(
    s => s.status !== 'PENDING' && s.reviewedAt && s.reviewedAt >= weekAgo
  ).length

  const submissionRows = submissions.map(s => {
    const daysAgo = Math.floor((now.getTime() - s.submittedAt.getTime()) / 86_400_000)
    const dueDate = s.assignment.dueDate
    const isLate  = dueDate ? s.submittedAt > dueDate : false
    return {
      id:              s.id,
      studentName:     s.user.name,
      studentEmail:    s.user.email,
      assignmentTitle: s.assignment.title,
      courseTitle:     s.assignment.lesson.module.course.title,
      githubUrl:       s.githubUrl,
      liveUrl:         s.liveUrl,
      notes:           s.notes,
      status:          s.status,
      grade:           s.grade,
      feedback:        s.feedback,
      submittedAt:     s.submittedAt.toISOString(),
      daysAgo,
      isLate,
    }
  })

  // ── Assignments (for management tab) ────────────────────────
  const assignments = await prisma.assignment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      lesson: {
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
        },
      },
      _count: { select: { submissions: true } },
    },
  })

  const assignmentRows = assignments.map(a => ({
    id:            a.id,
    title:         a.title,
    description:   a.description,
    dueDate:       a.dueDate?.toISOString() ?? null,
    maxScore:      (a as any).maxScore ?? 100,
    lessonId:      a.lessonId,
    lessonTitle:   a.lesson.title,
    courseTitle:   a.lesson.module.course.title,
    courseId:      a.lesson.module.course.id,
    submissions:   a._count.submissions,
    createdAt:     a.createdAt.toISOString(),
  }))

  const pending  = submissionRows.filter(r => r.status === 'PENDING').length
  const reviewed = submissionRows.filter(r => r.status !== 'PENDING').length
  const late     = submissionRows.filter(r => r.isLate).length

  return (
    <AdminAssignmentsClient
      submissions={submissionRows}
      stats={{ pending, reviewed, late, reviewedThisWeek }}
      assignments={assignmentRows}
    />
  )
}