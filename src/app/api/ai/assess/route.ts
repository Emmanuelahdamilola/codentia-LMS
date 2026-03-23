// PATH: src/app/api/admin/ai/assess/route.ts
import { auth }                       from '@/auth'
import { generateAssignmentFeedback } from '@/lib/ai'
import { NextResponse }               from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assignmentTitle, studentNotes, githubUrl, liveUrl } = await req.json()
  if (!assignmentTitle) return NextResponse.json({ error: 'assignmentTitle required' }, { status: 400 })

  try {
    const assessment = await generateAssignmentFeedback(
      assignmentTitle,
      'Review the student submission and provide structured feedback with bullet points.',
      studentNotes ?? undefined,
      githubUrl    ?? undefined,
    )
    return NextResponse.json({ assessment })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI failed' }, { status: 500 })
  }
}