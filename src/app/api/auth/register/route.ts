// PATH: src/app/api/auth/register/route.ts
import { prisma }                  from '@/lib/prisma'
import { sendVerificationEmail }   from '@/lib/email'
import { NextResponse }            from 'next/server'
import bcrypt                      from 'bcryptjs'
import { randomBytes }             from 'crypto'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)

  // Generate a secure verification token (expires in 24h)
  const verifyToken   = randomBytes(32).toString('hex')
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.user.create({
    data: {
      name,
      email,
      password:      hashed,
      emailVerified: null,          // null = not verified yet
      verifyToken,
      verifyExpires,
    },
  })

  // Send verification email (non-fatal if it fails — user can request resend)
  try {
    await sendVerificationEmail(email, name, verifyToken)
  } catch (err) {
    console.error('[register] Failed to send verification email:', err)
  }

  return NextResponse.json({ success: true, message: 'Check your email to verify your account.' })
}