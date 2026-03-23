// PATH: src/app/api/progress/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST /api/progress — mark a lesson as complete
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  let lessonId: string | undefined
  try {
    const body = await req.json()
    lessonId   = body.lessonId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
  }

  // Verify the lesson exists
  const lesson = await prisma.lesson.findUnique({
    where:  { id: lessonId },
    select: { id: true, moduleId: true, module: { select: { courseId: true } } },
  })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  // Verify the user is enrolled in the course
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
  }

  // Upsert progress record (idempotent — safe to call multiple times)
  await prisma.progressRecord.upsert({
    where:  { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  })

  return NextResponse.json({ success: true })
}

// GET /api/progress — get completion status for lessons in a course
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
  }

  const records = await prisma.progressRecord.findMany({
    where: {
      userId:  session.user.id,
      lesson:  { module: { courseId } },
    },
    select: { lessonId: true, completedAt: true },
  })

  return NextResponse.json(records)
}