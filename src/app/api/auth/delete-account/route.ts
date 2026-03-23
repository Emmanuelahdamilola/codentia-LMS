// PATH: src/app/api/auth/delete-account/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Require password confirmation before deleting
  const { password } = await req.json()
  if (!password) return NextResponse.json({ error: 'Password confirmation required' }, { status: 400 })

  // Verify password
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, password: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const bcrypt = await import('bcryptjs')
  const valid  = await bcrypt.compare(password, user.password ?? '')
  if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })

  // Cascade delete — Prisma onDelete: Cascade handles related records
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ success: true })
}