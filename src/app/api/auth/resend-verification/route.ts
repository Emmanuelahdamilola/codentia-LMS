// PATH: src/app/api/auth/resend-verification/route.ts
import { prisma }                from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { NextResponse }          from 'next/server'
import { randomBytes }           from 'crypto'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await (prisma as any).user.findUnique({
    where:  { email },
    select: { id: true, name: true, emailVerified: true },
  })

  if (!user)             return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true })

  const verifyToken   = randomBytes(32).toString('hex')
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await (prisma as any).user.update({
    where: { id: user.id },
    data:  { verifyToken, verifyExpires },
  })

  await sendVerificationEmail(email, user.name, verifyToken)

  return NextResponse.json({ success: true })
}