// PATH: src/app/api/admin/quiz/save/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface GeneratedQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId, questions }: { lessonId: string; questions: GeneratedQuestion[] } = await req.json()

  if (!lessonId || !questions?.length) {
    return NextResponse.json({ error: 'lessonId and questions are required' }, { status: 400 })
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  // Check if quiz already exists for this lesson
  const existing = await prisma.quiz.findUnique({ where: { lessonId } })
  if (existing) {
    return NextResponse.json({ error: 'This lesson already has a quiz' }, { status: 409 })
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: `${lesson.title} Quiz`,
      lessonId,
      questions: {
        create: questions.map((q, i) => ({
          question: q.question,
          order: i + 1,
          correctOption: q.correctIndex,
          explanation: q.explanation ?? null,
          options: {
            create: q.options.map((text, j) => ({ text, order: j })),
          },
        })),
      },
    },
  })

  // Mark lesson as having a quiz
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { hasQuiz: true },
  })

  return NextResponse.json({ quizId: quiz.id }, { status: 201 })
}