// PATH: src/app/api/admin/lessons/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId, title, content, videoUrl, hasQuiz, hasAssignment } = await req.json()
  if (!moduleId || !title) {
    return NextResponse.json({ error: 'moduleId and title required' }, { status: 400 })
  }

  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const lesson = await prisma.lesson.create({
    data: {
      title,
      content:       content       || null,
      videoUrl:      videoUrl      || null,
      hasQuiz:       hasQuiz       ?? false,
      hasAssignment: hasAssignment ?? false,
      moduleId,
      order: (lastLesson?.order ?? 0) + 1,
    },
  })

  return NextResponse.json(lesson, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId, title, content, videoUrl, hasQuiz, hasAssignment } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(title         !== undefined && { title }),
      ...(content       !== undefined && { content }),
      ...(videoUrl      !== undefined && { videoUrl }),
      ...(hasQuiz       !== undefined && { hasQuiz }),
      ...(hasAssignment !== undefined && { hasAssignment }),
    },
  })

  return NextResponse.json(lesson)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  await prisma.lesson.delete({ where: { id: lessonId } })
  return NextResponse.json({ success: true })
}
