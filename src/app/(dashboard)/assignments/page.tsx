// PATH: src/app/(dashboard)/assignments/page.tsx
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import Link        from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Assignments — Codentia' }

export default async function AssignmentsPage() {
  const session = await auth()
  const userId  = session!.user.id
  const now     = new Date()

  const enrollments = await prisma.enrollment.findMany({
    where:  { userId },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const assignments = await prisma.assignment.findMany({
    where:   { lesson: { module: { courseId: { in: courseIds } } } },
    orderBy: { dueDate: 'asc' },
    include: {
      lesson: {
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
        },
      },
      submissions: {
        where:  { userId },
        select: { id: true, status: true, grade: true, submittedAt: true },
        take:   1,
      },
    },
  })

  const pending   = assignments.filter(a => a.submissions.length === 0)
  const submitted = assignments.filter(a => a.submissions.length > 0)

  return (
    <div className="p-7 max-w-[860px]">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[24px] font-black text-[#424040] tracking-tight">Assignments</h1>
        <p className="text-[13px] text-[#8A8888] mt-1">
          {pending.length} pending · {submitted.length} submitted
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          <div className="w-12 h-12 rounded-xl bg-[#E9E3FF] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="font-bold text-[#424040] mb-1">No assignments yet</p>
          <p className="text-[13px] text-[#8A8888]">Assignments appear as you progress through your lessons.</p>
          <Link href="/courses" className="inline-block mt-4 text-[13px] font-bold text-[#8A70D6] hover:underline">Browse Courses →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {pending.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[1px] text-[#8A8888] mb-3">
                Pending — {pending.length}
              </h2>
              <div className="flex flex-col gap-2.5">
                {pending.map(a => <AssignmentRow key={a.id} assignment={a} now={now} />)}
              </div>
            </div>
          )}
          {submitted.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[1px] text-[#8A8888] mb-3">
                Submitted — {submitted.length}
              </h2>
              <div className="flex flex-col gap-2.5">
                {submitted.map(a => <AssignmentRow key={a.id} assignment={a} now={now} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AssignmentRow({ assignment, now }: { assignment: any; now: Date }) {
  const submission = assignment.submissions[0] as { id: string; status: string; grade: number | null; submittedAt: Date } | undefined
  const due        = assignment.dueDate ? new Date(assignment.dueDate) : null
  const isOverdue  = !submission && due && due < now
  const daysLeft   = due ? Math.ceil((due.getTime() - now.getTime()) / 86_400_000) : null
  const course     = assignment.lesson.module.course as { id: string; title: string }

  const statusMap: Record<string, { label: string; cls: string }> = {
    PENDING:             { label: 'Pending review',      cls: 'bg-[#FEF3C7] text-[#D97706]'  },
    AI_REVIEWED:         { label: 'AI reviewed',         cls: 'bg-[#E9E3FF] text-[#8A70D6]'  },
    INSTRUCTOR_REVIEWED: { label: 'Instructor reviewed', cls: 'bg-[#DBEAFE] text-[#1D4ED8]'  },
    GRADED:              { label: 'Graded',              cls: 'bg-[#DCFCE7] text-[#16A34A]'  },
  }

  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className="bg-white border border-[#EBEBEB] rounded-[14px] px-5 py-4 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,.06)] hover:shadow-[0_4px_24px_rgba(138,112,214,.12)] hover:border-[#D4CAF7] hover:-translate-y-0.5 transition-all duration-200 no-underline"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
        submission ? 'bg-[#DCFCE7]' : isOverdue ? 'bg-[#FEE2E2]' : 'bg-[#E9E3FF]'
      }`}>
        {submission ? (
          <svg className="w-5 h-5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        ) : isOverdue ? (
          <svg className="w-5 h-5 text-[#EF4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#424040] truncate">{assignment.title}</p>
        <p className="text-[12px] text-[#8A8888] mt-0.5 truncate">{course.title}</p>
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          {due && (
            <span className={`text-[11px] font-medium flex items-center gap-1 ${isOverdue ? 'text-[#EF4444]' : daysLeft === 1 ? 'text-[#D97706]' : 'text-[#8A8888]'}`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
          )}
          {submission && statusMap[submission.status] && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusMap[submission.status].cls}`}>
              {statusMap[submission.status].label}
            </span>
          )}
          {submission?.grade !== null && submission?.grade !== undefined && (
            <span className="text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">
              {submission.grade}/100
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-[#8A8888] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  )
}
