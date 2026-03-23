// PATH: src/app/api/quiz/check/route.ts
// Returns the correctOption for a single question — used for per-question feedback.
// Does NOT save a result; that only happens on final submit.
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { quizId: string; questionId: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { quizId, questionId } = body
  if (!quizId || !questionId) {
    return NextResponse.json({ error: 'quizId and questionId required' }, { status: 400 })
  }

  // Verify the question belongs to this quiz
  const question = await prisma.quizQuestion.findFirst({
    where:  { id: questionId, quizId },
    select: { correctOption: true },
  })

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  // Verify enrollment
  const quiz = await prisma.quiz.findUnique({
    where:  { id: quizId },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  })

  const enrollment = quiz && await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: quiz.lesson.module.courseId } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  return NextResponse.json({ correctOption: question.correctOption })
}
