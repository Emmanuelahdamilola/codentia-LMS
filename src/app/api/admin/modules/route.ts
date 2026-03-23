// PATH: src/app/api/admin/modules/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, title } = await req.json()
  if (!courseId || !title) {
    return NextResponse.json({ error: 'courseId and title required' }, { status: 400 })
  }

  // Get next order number
  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const module = await prisma.module.create({
    data: {
      title,
      courseId,
      order: (lastModule?.order ?? 0) + 1,
    },
  })

  return NextResponse.json(module, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId } = await req.json()
  if (!moduleId) return NextResponse.json({ error: 'moduleId required' }, { status: 400 })

  await prisma.module.delete({ where: { id: moduleId } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { moduleId, title } = await req.json()
  if (!moduleId || !title) return NextResponse.json({ error: 'moduleId and title required' }, { status: 400 })
  const module = await prisma.module.update({ where: { id: moduleId }, data: { title } })
  return NextResponse.json(module)
}