// PATH: src/app/(dashboard)/quizzes/[quizId]/page.tsx
import { auth }       from '@/auth'
import { prisma }     from '@/lib/prisma'
import { notFound }   from 'next/navigation'
import Link           from 'next/link'
import type { Metadata } from 'next'
import QuizClient     from '@/components/dashboard/QuizClient'

interface Props { params: Promise<{ quizId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quizId } = await params
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { title: true } })
  return { title: quiz ? `${quiz.title} — Codentia` : 'Quiz' }
}

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params
  const session    = await auth()
  const userId     = session!.user.id

  const quiz = await prisma.quiz.findUnique({
    where:   { id: quizId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
      lesson: {
        select: {
          id:    true,
          title: true,
          module: {
            select: {
              id:    true,
              title: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  })

  if (!quiz) notFound()

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: quiz.lesson.module.course.id,
      },
    },
  })
  if (!enrollment) notFound()

  // Best previous result
  const bestResult = await prisma.quizResult.findFirst({
    where:   { userId, quizId },
    orderBy: { score: 'desc' },
    select:  { score: true, completedAt: true },
  })

  const courseId  = quiz.lesson.module.course.id
  const courseTitle = quiz.lesson.module.course.title
  const moduleTitle = quiz.lesson.module.title

  return (
    <div className="p-7 max-w-[820px]">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-[#9591A8] mb-6 flex-wrap">
        <Link href="/dashboard"              className="text-[#7C5CDB] hover:underline">Dashboard</Link>
        <span>›</span>
        <Link href={`/courses/${courseId}`}  className="text-[#7C5CDB] hover:underline truncate max-w-[140px]">{courseTitle}</Link>
        <span>›</span>
        <Link href={`/courses/${courseId}/learn/${quiz.lesson.id}`} className="text-[#7C5CDB] hover:underline truncate max-w-[140px]">{moduleTitle}</Link>
        <span>›</span>
        <span className="text-[#1A1523]">Quiz</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-black text-[#1A1523] tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-[13px] text-[#9591A8] mt-1">
            Test your understanding of {moduleTitle.toLowerCase()}.
          </p>
        </div>

        {/* Timer box — shown by QuizClient, just a placeholder here for layout */}
        <div className="bg-[#EDE8FF] rounded-[10px] px-4 py-3 text-center flex-shrink-0">
          <div className="text-[22px] font-black text-[#7C5CDB] tabular-nums tracking-tight leading-none">
            {quiz.questions.length > 5 ? '15:00' : '12:00'}
          </div>
          <div className="text-[11px] font-bold text-[#7C5CDB] mt-0.5">Time left</div>
        </div>
      </div>

      {/* Previous result banner */}
      {bestResult && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border mb-6 ${
          bestResult.score >= 60
            ? 'bg-[#DCFCE7] border-[#86EFAC]'
            : 'bg-[#FEF3C7] border-[#FDE68A]'
        }`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0 ${
            bestResult.score >= 60 ? 'bg-[#16A34A] text-white' : 'bg-[#D97706] text-white'
          }`}>
            {bestResult.score >= 60 ? '✓' : '↺'}
          </span>
          <div className="flex-1 min-w-0">
            <span className={`text-[13px] font-bold ${bestResult.score >= 60 ? 'text-[#15803D]' : 'text-[#92400E]'}`}>
              {bestResult.score >= 60 ? 'Previously passed' : 'Previously attempted'}
            </span>
            <span className={`text-[12px] ml-2 ${bestResult.score >= 60 ? 'text-[#166534]' : 'text-[#78350F]'}`}>
              Best score: {bestResult.score}%
            </span>
          </div>
          <span className="text-[11px] text-[#9591A8] flex-shrink-0">
            {new Date(bestResult.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}

      {/* Quiz client — all interactivity here */}
      <QuizClient
        quiz={quiz}
        lessonId={quiz.lesson.id}
        courseId={courseId}
        totalTimeSecs={quiz.questions.length > 5 ? 900 : 720}
      />
    </div>
  )
}