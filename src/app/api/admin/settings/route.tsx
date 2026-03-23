// PATH: src/app/api/admin/settings/route.ts
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — fetch current platform settings
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let settings = await (prisma as any).platformSettings.findUnique({
    where: { id: 'global' },
  })

  if (!settings) {
    // Auto-create defaults on first request
    settings = await (prisma as any).platformSettings.create({
      data: { id: 'global' },
    })
  }

  return NextResponse.json(settings)
}

// PATCH — save platform settings
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Whitelist updatable fields
  const allowed = [
    'platformName','supportEmail','timezone','logoUrl',
    'aiCodingAssistant','aiAssignmentFeedback','aiQuizGenerator','aiAtRiskDetection',
    'pointsSystem','badges','leaderboard',
    'emailLiveReminders','emailDeadlines','emailAiRecommend','emailReEngagement','emailNewCourse',
  ]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const settings = await (prisma as any).platformSettings.upsert({
    where:  { id: 'global' },
    create: { id: 'global', ...data },
    update: data,
  })

  return NextResponse.json({ success: true, settings })
}
// (cache invalidation is handled by the settings lib TTL — 60s)