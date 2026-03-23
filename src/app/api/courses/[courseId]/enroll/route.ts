// PATH: src/app/api/courses/[courseId]/enroll/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface Props {
  params: Promise<{ courseId: string }>
}

// POST /api/courses/[courseId]/enroll — enroll the current user
export async function POST(_req: Request, { params }: Props) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await params
  const userId = session.user.id

  // Verify course exists and is published
  const course = await prisma.course.findUnique({
    where:  { id: courseId, published: true },
    select: { id: true },
  })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Upsert — safe to call multiple times
  const enrollment = await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  })

  return NextResponse.json({ success: true, enrollment }, { status: 201 })
}

// DELETE /api/courses/[courseId]/enroll — unenroll
export async function DELETE(_req: Request, { params }: Props) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await params
  const userId = session.user.id

  await prisma.enrollment.deleteMany({ where: { userId, courseId } })

  return NextResponse.json({ success: true })
}