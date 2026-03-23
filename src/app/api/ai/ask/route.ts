// PATH: src/app/api/ai/ask/route.ts
import { auth }                from '@/auth'
import { prisma }              from '@/lib/prisma'
import { askAITutor }          from '@/lib/ai'
import { getPlatformSettings } from '@/lib/settings'
import { AIContext }           from '@prisma/client'
import { NextResponse }        from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Check platform setting ───────────────────────────────
  const settings = await getPlatformSettings()
  if (!settings.aiCodingAssistant) {
    return NextResponse.json({ error: 'AI assistant is currently disabled by the administrator.' }, { status: 403 })
  }

  const { question, lessonId, context } = await req.json()
  if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 })

  let lessonContext = context
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: { title: true, content: true },
    })
    if (lesson) {
      lessonContext = `Lesson: ${lesson.title}\n\n${lesson.content?.slice(0, 1000) ?? ''}`
    }
  }

  const answer = await askAITutor(question, lessonContext)

  await prisma.aIInteraction.create({
    data: {
      userId:    session.user.id,
      context:   lessonId ? AIContext.LESSON : AIContext.GENERAL,
      contextId: lessonId ?? null,
      prompt:    question,
      response:  answer,
    },
  })

  return NextResponse.json({ answer })
}