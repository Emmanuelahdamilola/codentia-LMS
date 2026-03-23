// PATH: src/app/api/auth/update-profile/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, bio, timezone } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name:     name.trim(),
      bio:      bio?.trim()      ?? null,
      timezone: timezone?.trim() ?? 'Africa/Lagos',
    },
  })

  return NextResponse.json({ success: true })
}