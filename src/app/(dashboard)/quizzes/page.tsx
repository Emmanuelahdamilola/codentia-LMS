// PATH: src/app/(dashboard)/quizzes/page.tsx
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import Link        from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quizzes — Codentia' }

export default async function QuizzesPage() {
  const session = await auth()
  const userId  = session!.user.id

  const enrollments = await prisma.enrollment.findMany({
    where:  { userId },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const quizzes = await prisma.quiz.findMany({
    where:   { lesson: { module: { courseId: { in: courseIds } } } },
    include: {
      lesson: {
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
        },
      },
      quizResults: {
        where:   { userId },
        orderBy: { score: 'desc' },
        take:    1,
        select:  { score: true, completedAt: true },
      },
      _count: { select: { questions: true } },
    },
    orderBy: { lesson: { module: { order: 'asc' } } },
  })

  const attempted   = quizzes.filter(q => q.quizResults.length > 0)
  const unattempted = quizzes.filter(q => q.quizResults.length === 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[860px] animate-fade-up">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#1A1523]" style={{ letterSpacing: "-0.025em" }}>Quizzes</h1>
        <p className="text-[13px] text-[#9591A8] mt-1">
          {attempted.length} completed · {unattempted.length} remaining
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-16 text-center" style={{ boxShadow: "0 2px 8px rgba(15,13,26,0.06)" }}>
          <div className="w-12 h-12 rounded-xl bg-[#EDE8FF] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#7C5CDB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p className="font-bold text-[#1A1523] mb-1">No quizzes yet</p>
          <p className="text-[13px] text-[#9591A8]">
            Quizzes will appear here as you progress through your lessons.
          </p>
          <Link href="/courses" className="inline-block mt-4 text-[13px] font-bold text-[#7C5CDB] hover:underline">
            Browse Courses →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* To Do */}
          {unattempted.length > 0 && (
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-[#9591A8] mb-4">
                To Do — {unattempted.length} quiz{unattempted.length !== 1 ? 'zes' : ''}
              </h2>
              <div className="flex flex-col gap-2.5">
                {unattempted.map(quiz => (
                  <QuizRow key={quiz.id} quiz={quiz} attempted={false} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {attempted.length > 0 && (
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-[#9591A8] mb-4">
                Completed — {attempted.length} quiz{attempted.length !== 1 ? 'zes' : ''}
              </h2>
              <div className="flex flex-col gap-2.5">
                {attempted.map(quiz => (
                  <QuizRow key={quiz.id} quiz={quiz} attempted={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Row component
// ─────────────────────────────────────────────────────────────

type QuizRow = Awaited<ReturnType<typeof prisma.quiz.findMany>>[0] & {
  quizResults: { score: number; completedAt: Date }[]
  _count: { questions: number }
  lesson: {
    module: { course: { id: string; title: string } }
  }
}

function QuizRow({ quiz, attempted }: { quiz: any; attempted: boolean }) {
  const result  = quiz.quizResults[0] as { score: number; completedAt: Date } | undefined
  const passed  = result && result.score >= 60
  const course  = quiz.lesson.module.course as { id: string; title: string }

  return (
    <Link
      href={`/quizzes/${quiz.id}`}
      className="bg-white border border-[#E9E7EF] rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-4 no-underline block animate-fade-up hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,92,219,0.14)] hover:border-[#C8C1E8] transition-all duration-[220ms]" style={{ boxShadow: "0 2px 8px rgba(15,13,26,0.06)" }}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
        !result  ? 'bg-[#EDE8FF]'
        : passed ? 'bg-[#DCFCE7]'
        :          'bg-[#FEF3C7]'
      }`}>
        {!result ? (
          <svg className="w-5 h-5 text-[#7C5CDB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ) : passed ? (
          <svg className="w-5 h-5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.15"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#1A1523] truncate">{quiz.title}</p>
        <p className="text-[12px] text-[#9591A8] mt-0.5 truncate">{course.title}</p>
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          <span className="text-[11px] text-[#9591A8]">
            {quiz._count.questions} question{quiz._count.questions !== 1 ? 's' : ''}
          </span>
          {result ? (
            <>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                passed ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'
              }`}>
                {result.score}% · {passed ? 'Passed' : 'Retry'}
              </span>
              <span className="text-[11px] text-[#B0ADAD]">
                {new Date(result.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </>
          ) : (
            <span className="text-[11px] font-bold bg-[#EDE8FF] text-[#7C5CDB] px-2 py-0.5 rounded-full">
              Not started
            </span>
          )}
        </div>
      </div>

      {/* Score or arrow */}
      {result ? (
        <div className={`text-[22px] font-semibold flex-shrink-0 tracking-tight ${passed ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
          {result.score}%
        </div>
      ) : (
        <svg className="w-4 h-4 text-[#9591A8] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </Link>
  )
}