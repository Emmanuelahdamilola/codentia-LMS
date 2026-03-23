// PATH: src/app/api/quiz/submit/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  let body: { quizId: string; answers: Record<string, number> }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { quizId, answers } = body
  if (!quizId || !answers) {
    return NextResponse.json({ error: 'quizId and answers are required' }, { status: 400 })
  }

  // Fetch quiz with correct answers
  const quiz = await prisma.quiz.findUnique({
    where:   { id: quizId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select:  { id: true, correctOption: true },
      },
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  })

  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: quiz.lesson.module.courseId } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  // Grade — build correct map and count right answers
  const correctMap: Record<string, number> = {}
  let   correctCount = 0

  for (const q of quiz.questions) {
    correctMap[q.id] = q.correctOption
    if (answers[q.id] === q.correctOption) correctCount++
  }

  const score = quiz.questions.length > 0
    ? Math.round((correctCount / quiz.questions.length) * 100)
    : 0

  // Persist result (allow retakes — create new record each time)
  await prisma.quizResult.create({
    data: { userId, quizId, score, answers },
  })

  // Notify user if score is high
  if (score === 100) {
    await prisma.notification.create({
      data: {
        userId,
        type:    'QUIZ_RESULT',
        title:   `Perfect score on ${quiz.title}!`,
        message: `You got 100% on "${quiz.title}". Outstanding!`,
        link:    `/quizzes/${quizId}`,
      },
    })
  }

  return NextResponse.json({ score, correct: correctMap, total: quiz.questions.length })
}