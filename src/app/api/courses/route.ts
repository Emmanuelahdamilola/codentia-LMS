// PATH: src/app/api/courses/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      difficulty: true,
      category: true,
      published: true,
      thumbnail: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(courses)
}