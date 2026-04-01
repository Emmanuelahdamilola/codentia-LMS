// PATH: src/app/(dashboard)/calendar/page.tsx
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import Link       from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendar — Codentia' }

export default async function CalendarPage() {
  const session = await auth()
  const userId  = session!.user.id

  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } })
  const courseIds   = enrollments.map(e => e.courseId)

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const [liveClasses, assignments] = await Promise.all([
    prisma.liveClass.findMany({
      where:   { courseId: { in: courseIds }, scheduledAt: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } },
      orderBy: { scheduledAt: 'asc' },
      include: { course: { select: { title: true } } },
    }),
    prisma.assignment.findMany({
      where:   { dueDate: { gte: monthStart, lte: monthEnd }, lesson: { module: { courseId: { in: courseIds } } } },
      orderBy: { dueDate: 'asc' },
      include: { lesson: { include: { module: { include: { course: { select: { title: true } } } } } } },
    }),
  ])

  // ── Event map (day → events for calendar grid) ────────────
  type CalEvent = { type: 'class' | 'deadline'; label: string; link: string; time: string | null }
  const eventMap = new Map<number, CalEvent[]>()

  const addEvent = (date: Date, ev: CalEvent) => {
    const d = date.getDate()
    if (!eventMap.has(d)) eventMap.set(d, [])
    eventMap.get(d)!.push(ev)
  }

  liveClasses.forEach(c => addEvent(new Date(c.scheduledAt), {
    type:  'class',
    label: c.title,
    link:  '/live-classes',
    time:  new Date(c.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }))

  assignments.forEach(a => {
    if (a.dueDate) {
      addEvent(new Date(a.dueDate), {
        type:  'deadline',
        label: a.title,
        link:  `/assignments/${a.id}`,
        time:  null,
      })
    }
  })

  // ── Calendar grid cells (Monday-first) ────────────────────
  let firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  firstDay = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // ── Upcoming events (next 14 days) — single unified type ──
  const soon = new Date(now.getTime() + 14 * 86_400_000)

  interface UpcomingEvent {
    date:  Date
    type:  'class' | 'deadline'
    label: string
    link:  string
    time:  string | null
  }

  const upcoming: UpcomingEvent[] = [
    ...liveClasses
      .filter(c => {
        const d = new Date(c.scheduledAt)
        return d >= now && d <= soon
      })
      .map(c => ({
        date:  new Date(c.scheduledAt),
        type:  'class' as const,
        label: c.title,
        link:  '/live-classes',
        time:  new Date(c.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })),
    ...assignments
      .filter(a => {
        if (!a.dueDate) return false
        const d = new Date(a.dueDate)
        return d >= now && d <= soon
      })
      .map(a => ({
        date:  new Date(a.dueDate!),
        type:  'deadline' as const,
        label: a.title,
        link:  `/assignments/${a.id}`,
        time:  null,
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const dotColor  = (t: 'class' | 'deadline') => t === 'class' ? '#7C5CDB' : '#F59E0B'
  const chipColor = (t: 'class' | 'deadline') =>
    t === 'class' ? 'bg-[#EDE8FF] text-[#6146C4]' : 'bg-[#FEF3C7] text-[#D97706]'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px]">
      <h1 className="text-[24px] font-semibold text-[#1A1523] tracking-tight mb-1" style={{ letterSpacing: "-0.025em" }}>Calendar</h1>
      <p className="text-[13px] text-[#9591A8] mb-6">Your classes, deadlines, and quizzes at a glance.</p>

      {/* Legend */}
      <div className="flex gap-4 mb-5">
        {(['class', 'deadline'] as const).map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor(t) }} />
            <span className="text-[12px] text-[#9591A8]">
              {t === 'class' ? 'Live Class' : 'Assignment Deadline'}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">

        {/* ── Calendar grid ── */}
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-5 shadow-[0_2px_8px_rgba(15,13,26,0.06)]">
          <p className="text-[14px] font-bold text-[#1A1523] mb-4">{monthLabel}</p>

          <div className="grid grid-cols-7 mb-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-[#9591A8] uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />

              const isToday = day === now.getDate()
              const isPast  = day < now.getDate()
              const events  = eventMap.get(day) ?? []

              return (
                <div
                  key={i}
                  className={[
                    'min-h-[68px] rounded-lg p-1 border transition-colors',
                    isToday       ? 'border-[#7C5CDB] bg-[#FAF8FF]'  :
                    events.length ? 'border-[#E9E7EF] bg-white'       :
                                    'border-transparent hover:bg-[#F7F7F9]',
                    isPast ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <div className={[
                    'text-[11px] font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-[#7C5CDB] text-white' : 'text-[#1A1523]',
                  ].join(' ')}>
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {events.slice(0, 2).map((ev, ei) => (
                      <Link
                        key={ei}
                        href={ev.link}
                        className={`block text-[9px] font-bold px-1 py-0.5 rounded truncate ${chipColor(ev.type)}`}
                      >
                        {ev.label}
                      </Link>
                    ))}
                    {events.length > 2 && (
                      <p className="text-[9px] text-[#9591A8] px-1">+{events.length - 2}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Upcoming sidebar ── */}
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-5 shadow-[0_2px_8px_rgba(15,13,26,0.06)]">
          <h2 className="text-[13px] font-bold text-[#1A1523] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#7C5CDB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
            Next 14 Days
          </h2>

          {upcoming.length === 0 ? (
            <p className="text-[13px] text-[#9591A8] text-center py-8">
              Nothing coming up — you&apos;re all clear! 🎉
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map((ev, i) => (
                <Link
                  key={i}
                  href={ev.link}
                  className="flex gap-3 p-3 rounded-xl bg-[#F7F7F9] hover:bg-[#EDE8FF] transition-colors no-underline"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${chipColor(ev.type)}`}>
                    {ev.type === 'class' ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#1A1523] truncate">{ev.label}</p>
                    <p className="text-[10px] text-[#9591A8] mt-0.5">
                      {ev.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {ev.time ? ` · ${ev.time}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}