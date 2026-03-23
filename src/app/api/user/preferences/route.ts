// PATH: src/app/api/user/preferences/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — load preferences
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = await (prisma as any).userPreferences.findUnique({
    where: { userId: session.user.id },
  })

  // Return defaults if no row yet
  return NextResponse.json(prefs ?? {
    emailNewLessons:     true,
    emailDeadlines:      true,
    emailClassReminders: true,
    emailAiFeedback:     true,
    timezone:            'Africa/Lagos',
  })
}

// PATCH — save preferences
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body    = await req.json()
  const allowed = ['emailNewLessons','emailDeadlines','emailClassReminders','emailAiFeedback','timezone']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const prefs = await (prisma as any).userPreferences.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  })

  return NextResponse.json({ success: true, prefs })
}