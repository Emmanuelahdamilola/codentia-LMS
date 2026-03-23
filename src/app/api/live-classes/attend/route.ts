// PATH: src/app/api/live-classes/attend/route.ts
// Records that a student joined a live class (called when they click Join)
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { liveClassId } = await req.json()
  if (!liveClassId) return NextResponse.json({ error: 'liveClassId required' }, { status: 400 })

  // Verify the class exists and is live or upcoming
  const liveClass = await prisma.liveClass.findUnique({
    where:  { id: liveClassId },
    select: { id: true, status: true, meetingLink: true, title: true },
  })
  if (!liveClass) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  // Upsert attendance record (idempotent — clicking join multiple times is fine)
  await prisma.liveClassAttendance.upsert({
    where:  { userId_liveClassId: { userId: session.user.id, liveClassId } },
    create: { userId: session.user.id, liveClassId },
    update: {},
  })

  return NextResponse.json({ success: true, meetingLink: liveClass.meetingLink })
}