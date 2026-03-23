// PATH: src/app/api/admin/quiz/generate/route.ts
import { auth } from '@/auth'
import { generateQuiz } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt, count } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    const questions = await generateQuiz(prompt, count ?? 5)
    return NextResponse.json({ questions })
  } catch (err) {
    console.error('Quiz generation failed:', err)
    return NextResponse.json({ error: 'AI generation failed. Check your OpenAI key.' }, { status: 500 })
  }
}