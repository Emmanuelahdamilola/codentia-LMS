import { prisma } from '@/lib/prisma'
import AIQuizGenerator from '@/components/admin/AIQuizGenerator'
import { CheckSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quiz Management' }

export default async function AdminQuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      lesson: { include: { module: { include: { course: { select: { title: true } } } } } },
      _count: { select: { questions: true, quizResults: true } },
    },
  })

  const lessons = await prisma.lesson.findMany({
    where: { hasQuiz: false, quiz: null },
    select: { id: true, title: true, module: { select: { course: { select: { title: true } } } } },
    orderBy: { title: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1523]">Quiz Management</h1>
        <p className="text-[#9591A8] text-sm mt-1">{quizzes.length} quizzes · AI generator available</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Quiz Generator */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">🤖</span>
              <h2 className="font-bold text-[#1A1523]">AI Quiz Generator</h2>
            </div>
            <AIQuizGenerator lessons={lessons} />
          </div>
        </div>

        {/* Quiz list */}
        <div className="lg:col-span-2 space-y-3">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDE8FF] flex items-center justify-center shrink-0">
                  <CheckSquare size={18} className="text-[#7C5CDB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1A1523]">{quiz.title}</p>
                  <p className="text-xs text-[#9591A8]">
                    {quiz.lesson.module.course.title} · {quiz.lesson.title}
                  </p>
                  <div className="flex gap-4 mt-1.5 text-xs text-[#9591A8]">
                    <span>{quiz._count.questions} questions</span>
                    <span>{quiz._count.quizResults} attempts</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="card text-center py-10">
              <CheckSquare size={32} className="text-[#EDE8FF] mx-auto mb-3" />
              <p className="text-[#9591A8] text-sm">No quizzes yet. Use the AI generator to create one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}