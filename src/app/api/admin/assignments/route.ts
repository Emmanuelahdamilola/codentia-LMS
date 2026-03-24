// GET — fetch assignment by lessonId
export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get('lessonId')
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  const assignment = await prisma.assignment.findUnique({ where: { lessonId } })
  if (!assignment) return NextResponse.json({}, { status: 404 })
  return NextResponse.json(assignment)
}

// PATH: src/app/api/admin/assignments/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST — create assignment for a lesson
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId, title, description, dueDate, maxScore } = await req.json()
  if (!lessonId || !title || !description) {
    return NextResponse.json({ error: 'lessonId, title and description required' }, { status: 400 })
  }

  // Check if assignment already exists for this lesson
  const existing = await prisma.assignment.findUnique({ where: { lessonId } })
  if (existing) {
    return NextResponse.json({ error: 'This lesson already has an assignment' }, { status: 409 })
  }

  const assignment = await prisma.assignment.create({
    data: {
      lessonId,
      title,
      description,
      dueDate:  dueDate  ? new Date(dueDate)  : null,
      maxScore: maxScore ? Number(maxScore)    : 100,
    },
  })

  // Mark lesson as having an assignment
  await prisma.lesson.update({
    where: { id: lessonId },
    data:  { hasAssignment: true },
  })

  return NextResponse.json(assignment, { status: 201 })
}

// PATCH — update existing assignment
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assignmentId, title, description, dueDate, maxScore } = await req.json()
  if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (title       !== undefined) data.title       = title
  if (description !== undefined) data.description = description
  if (dueDate     !== undefined) data.dueDate     = dueDate ? new Date(dueDate) : null
  if (maxScore    !== undefined) data.maxScore     = Number(maxScore) || 100

  const assignment = await prisma.assignment.update({
    where: { id: assignmentId }, data,
  })
  return NextResponse.json(assignment)
}

// DELETE — remove assignment
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assignmentId } = await req.json()
  if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

  const assignment = await prisma.assignment.findUnique({
    where:  { id: assignmentId },
    select: { lessonId: true },
  })

  await prisma.assignment.delete({ where: { id: assignmentId } })

  if (assignment?.lessonId) {
    await prisma.lesson.update({
      where: { id: assignment.lessonId },
      data:  { hasAssignment: false },
    })
  }

  return NextResponse.json({ success: true })
}