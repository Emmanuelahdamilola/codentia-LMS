// PATH: src/app/(dashboard)/live-classes/page.tsx
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import type { Metadata } from 'next'
import LiveClassesClient from '@/components/dashboard/LiveClassesClient'

export const metadata: Metadata = { title: 'Live Classes — Codentia' }

export default async function LiveClassesPage() {
  const session = await auth()
  const userId  = session!.user.id
  const now     = new Date()

  const [liveNow, upcoming, completed, attendedIds] = await Promise.all([
    // Currently live
    prisma.liveClass.findMany({
      where:   { status: 'LIVE' },
      orderBy: { scheduledAt: 'asc' },
      include: { course: { select: { id: true, title: true } } },
    }),

    // Upcoming (not yet started, not cancelled)
    prisma.liveClass.findMany({
      where:   { scheduledAt: { gte: now }, status: { in: ['SCHEDULED'] } },
      orderBy: { scheduledAt: 'asc' },
      include: { course: { select: { id: true, title: true } } },
    }),

    // Completed (recordings)
    prisma.liveClass.findMany({
      where:   { status: 'COMPLETED' },
      orderBy: { scheduledAt: 'desc' },
      take:    12,
      include: { course: { select: { id: true, title: true } } },
    }),

    // Which classes has this user attended?
    prisma.liveClassAttendance.findMany({
      where:  { userId },
      select: { liveClassId: true },
    }).then(rows => new Set(rows.map(r => r.liveClassId))),
  ])

  // Pick the first live-now class as the banner (or first upcoming today)
  const bannerClass = liveNow[0] ?? (() => {
    const todayUpcoming = upcoming.filter(c => new Date(c.scheduledAt).toDateString() === now.toDateString())
    return todayUpcoming[0] ?? null
  })()

  // Serialise dates for the client component
  const serialise = (cls: any) => ({
    ...cls,
    scheduledAt: cls.scheduledAt.toISOString(),
  })

  return (
    <LiveClassesClient
      bannerClass={bannerClass ? serialise(bannerClass) : null}
      isBannerLive={!!liveNow[0]}
      upcoming={upcoming.map(serialise)}
      completed={completed.map(serialise)}
      attendedIds={[...attendedIds]}
    />
  )
}