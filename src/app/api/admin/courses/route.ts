
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ── POST — create course ───────────────────────────────────
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, difficulty, category, published, price, thumbnail } = await req.json()
  if (!title || !description) {
    return NextResponse.json({ error: 'title and description required' }, { status: 400 })
  }

  const slug     = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existing = await prisma.course.findUnique({ where: { slug } })
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const course = await prisma.course.create({
    data: {
      title,
      slug:        finalSlug,
      description,
      difficulty:  difficulty ?? 'BEGINNER',
      category:    category   || null,
      published:   !!published,
      price:       price      ?? 0,
      thumbnail:   thumbnail  || null,
    },
  })

  return NextResponse.json(course, { status: 201 })
}

// ── PATCH — update course ──────────────────────────────────
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, title, description, difficulty, category, published, price, thumbnail } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (title       !== undefined) data.title       = title
  if (description !== undefined) data.description = description
  if (difficulty  !== undefined) data.difficulty  = difficulty
  if (category    !== undefined) data.category    = category    || null
  if (published   !== undefined) data.published   = !!published
  if (price       !== undefined) data.price       = Number(price) || 0
  if (thumbnail   !== undefined) data.thumbnail   = thumbnail    || null

  const course = await prisma.course.update({ where: { id: courseId }, data })
  return NextResponse.json(course)
}

// ── DELETE — delete course ─────────────────────────────────
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  await prisma.course.delete({ where: { id: courseId } })
  return NextResponse.json({ success: true })
}