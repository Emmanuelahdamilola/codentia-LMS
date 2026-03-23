// PATH: src/app/api/admin/courses/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, difficulty, category, published } = await req.json()
  if (!title || !description) {
    return NextResponse.json({ error: 'title and description required' }, { status: 400 })
  }

  // Auto-generate slug from title
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existing = await prisma.course.findUnique({ where: { slug } })
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const course = await prisma.course.create({
    data: {
      title,
      slug: finalSlug,
      description,
      difficulty: difficulty ?? 'BEGINNER',
      category: category || null,
      published: !!published,
    },
  })

  return NextResponse.json(course, { status: 201 })
}