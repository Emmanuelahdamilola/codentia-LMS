// PATH: src/app/api/auth/verify-email/route.ts
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const user = await (prisma as any).user.findFirst({
    where: { verifyToken: token },
    select: { id: true, verifyExpires: true, emailVerified: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 })
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true })
  }

  if (user.verifyExpires && new Date(user.verifyExpires) < new Date()) {
    return NextResponse.json({ error: 'This link has expired. Please request a new one.' }, { status: 400 })
  }

  await (prisma as any).user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verifyToken:   null,
      verifyExpires: null,
    },
  })

  return NextResponse.json({ success: true })
}