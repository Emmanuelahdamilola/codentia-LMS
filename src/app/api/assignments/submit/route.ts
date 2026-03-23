// PATH: src/app/api/assignments/submit/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { askAITutor }   from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  let body: { assignmentId: string; githubUrl?: string; liveUrl?: string; fileUrl?: string; notes?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { assignmentId, githubUrl, liveUrl, fileUrl, notes } = body

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 })
  }
  if (!githubUrl && !liveUrl && !fileUrl) {
    return NextResponse.json({ error: 'Provide at least a GitHub URL, Live URL, or file upload' }, { status: 400 })
  }

  // Verify assignment exists and user is enrolled
  const assignment = await prisma.assignment.findUnique({
    where:   { id: assignmentId },
    include: {
      lesson: {
        include: { module: { select: { courseId: true } } },
      },
    },
  })
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: assignment.lesson.module.courseId } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  // Prevent duplicate submissions
  const existing = await prisma.submission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
  })
  if (existing) return NextResponse.json({ error: 'Already submitted' }, { status: 409 })

  // Generate AI feedback asynchronously (best-effort, only if enabled)
  const { getPlatformSettings } = await import('@/lib/settings')
  const platformSettings = await getPlatformSettings()
  let aiFeedback: string | null = null
  if (platformSettings.aiAssignmentFeedback) {
    try {
    const prompt = `Review this student assignment submission for "${assignment.title}":
${assignment.description}

Student submission:
- GitHub URL: ${githubUrl ?? 'Not provided'}
- Live URL:   ${liveUrl   ?? 'Not provided'}
- File:       ${fileUrl   ?? 'Not provided'}
- Notes: ${notes ?? 'None'}

Provide concise, constructive feedback in 2-4 bullet points covering: what looks good, what could be improved, and one specific actionable suggestion. Keep it encouraging and specific.`

    aiFeedback = await askAITutor(prompt, `Assignment: ${assignment.title}`)
    } catch {
      // AI feedback is optional — don't block submission if it fails
    }
  }

  // Save submission
  const submission = await prisma.submission.create({
    data: {
      userId,
      assignmentId,
      githubUrl:  githubUrl  || null,
      liveUrl:    liveUrl    || null,
      fileUrl:    fileUrl    || null,
      notes:      notes      || null,
      aiFeedback: aiFeedback || null,
      status:     aiFeedback ? 'AI_REVIEWED' : 'PENDING',
    },
  })

  // Log AI interaction if feedback was generated
  if (aiFeedback) {
    await prisma.aIInteraction.create({
      data: {
        userId,
        context:   'ASSIGNMENT',
        contextId: assignmentId,
        prompt:    `Assignment review: ${assignment.title}`,
        response:  aiFeedback,
      },
    })
  }

  // Send notification
  await prisma.notification.create({
    data: {
      userId,
      type:    'ASSIGNMENT_FEEDBACK',
      title:   `Submission received: ${assignment.title}`,
      message: aiFeedback
        ? 'Your assignment was received and AI feedback is ready. Instructor review pending.'
        : 'Your assignment was received. Instructor review is pending.',
      link: `/assignments/${assignmentId}`,
    },
  })

  return NextResponse.json({ success: true, submissionId: submission.id, aiFeedback })
}