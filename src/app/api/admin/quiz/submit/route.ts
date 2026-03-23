// PATH: src/app/api/quiz/submit/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {                                          // 1. safer null check
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  let body: { quizId?: string; answers?: Record<string, number> }
  try {
    body = await req.json()                                          // 2. guard malformed JSON
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { quizId, answers } = body

  if (!quizId || !answers) {
    return NextResponse.json({ error: 'quizId and answers required' }, { status: 400 })
  }

  const quiz = await prisma.quiz.findUnique({
    where:   { id: quizId },
    include: {
      questions: {
        include: { options: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  let correctCount = 0
  quiz.questions.forEach(q => {
    if (answers[q.id] === q.correctOption) correctCount++
  })

  const score = Math.round((correctCount / quiz.questions.length) * 100)

  // Upsert via findFirst to avoid compound-key type issues
  const existing = await prisma.quizResult.findFirst({ where: { userId, quizId } })

  if (existing) {
    await prisma.quizResult.update({
      where: { id: existing.id },
      data:  { score, answers, completedAt: new Date() },
    })
  } else {
    await prisma.quizResult.create({
      data: { userId, quizId, score, answers },
    })
  }

  if (score >= 60) {
    await prisma.notification.create({
      data: {
        userId,
        type:    'QUIZ_RESULT',
        title:   `Quiz passed! ${score}%`,
        message: `You passed "${quiz.title}" with ${score}%.`,
        link:    `/quizzes/${quizId}`,
      },
    })
  }

  return NextResponse.json({ score, correctCount, total: quiz.questions.length })
}