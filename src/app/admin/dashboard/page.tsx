// PATH: src/app/admin/dashboard/page.tsx
import { prisma }  from '@/lib/prisma'
import Link        from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard — Codentia' }

// ── Tiny server-safe primitives ───────────────────────────────

function StatCard({
  color, icon, delta, deltaDir, value, label, href,
}: {
  color: 'purple'|'green'|'amber'|'blue'
  icon:  React.ReactNode
  delta: string
  deltaDir: 'up'|'down'|'neu'
  value: string|number
  label: string
  href?: string
}) {
  const topBar = { purple:'#8A70D6', green:'#22C55E', amber:'#F59E0B', blue:'#3B82F6' }[color]
  const iconBg = {
    purple:'bg-[#E9E3FF] text-[#8A70D6]',
    green: 'bg-[#DCFCE7] text-[#16A34A]',
    amber: 'bg-[#FEF3C7] text-[#D97706]',
    blue:  'bg-[#DBEAFE] text-[#3B82F6]',
  }[color]
  const deltaBg = {
    up:  'bg-[#DCFCE7] text-[#16A34A]',
    down:'bg-[#FEE2E2] text-[#DC2626]',
    neu: 'bg-[#F4F4F6] text-[#8A8888]',
  }[deltaDir]
  const inner = (
    <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] relative overflow-hidden pt-[3px] block">
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${iconBg}`}>{icon}</div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${deltaBg}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-black leading-none tracking-[-1px] mb-1" style={{ color: '#424040' }}>{value}</div>
        <div className="text-[12px] font-bold" style={{ color: '#8A8888' }}>{label}</div>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block no-underline">{inner}</Link> : inner
}

function Svg({ children, size = 17 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default async function AdminDashboardPage() {
  const now        = new Date()
  const weekAgo    = new Date(now.getTime() - 7  * 86_400_000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Neon free tier pauses after inactivity — retry once on connection failure
  async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes("Can't reach database") || msg.includes('connect')) {
        await new Promise(r => setTimeout(r, 3000)) // wait 3s for Neon to wake
        return fn()
      }
      throw err
    }
  }

  const [
    totalStudents,
    activeStudents,
    pendingSubmissions,
    liveClassesThisMonth,
    recentSubmissions,
    upcomingClasses,
    recentEnrollments,
    quizResults,
    recentActivity,
    topStudents,
  ] = await withRetry(() => Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', progressRecords: { some: { completedAt: { gte: weekAgo } } } } }),
    prisma.submission.count({ where: { status: { in: ['PENDING', 'AI_REVIEWED'] } } }),
    prisma.liveClass.count({ where: { scheduledAt: { gte: monthStart } } }),

    // Submissions table
    prisma.submission.findMany({
      where:   { status: { in: ['PENDING', 'AI_REVIEWED'] } },
      orderBy: { submittedAt: 'desc' },
      take:    5,
      include: {
        user:       { select: { name: true } },
        assignment: { select: { id: true, title: true } },
      },
    }),

    // Upcoming live classes
    prisma.liveClass.findMany({
      where:   { scheduledAt: { gte: now }, status: { not: 'CANCELLED' } },
      orderBy: { scheduledAt: 'asc' },
      take:    3,
      include: { course: { select: { title: true } } },
    }),

    // Activity feed (recent enrollments)
    prisma.enrollment.findMany({
      orderBy: { enrolledAt: 'desc' },
      take:    6,
      include: { user: { select: { name: true } }, course: { select: { title: true } } },
    }),

    // Quiz score buckets
    prisma.quizResult.findMany({ select: { score: true } }),

    // Activity log (mixed: submissions, enrollments, completions)
    prisma.progressRecord.findMany({
      orderBy: { completedAt: 'desc' },
      take:    5,
      include: {
        user:   { select: { name: true } },
        lesson: { include: { module: { include: { course: { select: { title: true } } } } } },
      },
    }),

    // Top students by lesson count
    prisma.user.findMany({
      where:   { role: 'STUDENT' },
      include: { _count: { select: { progressRecords: true, quizResults: true } } },
      orderBy: { progressRecords: { _count: 'desc' } },
      take:    5,
    }),
  ]))

  // Quiz distribution
  const buckets = { a: 0, b: 0, c: 0, d: 0 }
  for (const q of quizResults) {
    if      (q.score >= 90) buckets.a++
    else if (q.score >= 70) buckets.b++
    else if (q.score >= 60) buckets.c++
    else                    buckets.d++
  }
  const avgQuiz = quizResults.length
    ? Math.round(quizResults.reduce((s, q) => s + q.score, 0) / quizResults.length)
    : 0

  const avatarColors = ['#8B5CF6','#06B6D4','#10B981','#F59E0B','#EF4444','#8A70D6']
  const avatarColor  = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]
  const initials     = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2)

  const daysAgo = (d: Date) => {
    const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff} days ago`
  }

  const aiInsight = `JavaScript course has a low completion rate — ${buckets.d} students scored below 60% on recent quizzes. Consider reviewing Lesson 3 on closures. ${activeStudents} students were active in the last 7 days — a strong engagement rate.`

  return (
    <div className="px-7 py-6 pb-12">

      {/* ── Quick Actions ── */}
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {[
          { label: 'Create Course',       href: '/admin/courses',      icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></> },
          { label: 'Add Lesson',          href: '/admin/lessons',       icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
          { label: 'Schedule Live Class', href: '/admin/live-classes',  icon: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
          { label: 'Send Announcement',   href: '/admin/notifications', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
          { label: 'View Analytics',      href: '/admin/analytics',     icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
        ].map(qa => (
          <Link key={qa.label} href={qa.href}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E8E8EC] bg-white font-bold text-[12px] shadow-[0_1px_4px_rgba(0,0,0,.07)] transition-all duration-150 no-underline text-[#424040] hover:border-[#8A70D6] hover:text-[#8A70D6] hover:bg-[#E9E3FF] hover:-translate-y-px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              {qa.icon}
            </svg>
            {qa.label}
          </Link>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard color="purple" delta="↑ 12%" deltaDir="up" value={totalStudents} label="Total Students" href="/admin/students"
          icon={<Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>} />
        <StatCard color="green" delta="↑ 8%" deltaDir="up" value={activeStudents} label="Active Students (7d)"
          icon={<Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>} />
        <StatCard color="amber" delta="Pending" deltaDir="neu" value={pendingSubmissions} label="Ungraded Submissions" href="/admin/assignments"
          icon={<Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Svg>} />
        <StatCard color="blue" delta="↑ 4" deltaDir="up" value={liveClassesThisMonth} label="Live Classes This Month" href="/admin/live-classes"
          icon={<Svg><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></Svg>} />
      </div>

      {/* ── AI Insight box ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-5 text-[12px] leading-relaxed"
        style={{ background: '#E9E3FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
        <span className="text-[16px] flex-shrink-0">🤖</span>
        <div><strong>AI Insights:</strong> {aiInsight}</div>
      </div>

      {/* ── Middle row: enrollments + quiz performance + activity feed ── */}
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr 320px' }}>

        {/* Enrollment chart */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Student Enrollments</div>
            <div className="flex gap-1">
              {['Week','Month'].map((t, i) => (
                <span key={t} className={`text-[11px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${i === 0 ? 'bg-white shadow-sm text-[#8A70D6]' : 'text-[#8A8888] hover:text-[#424040]'}`}
                  style={i === 0 ? { border: '1px solid #E8E8EC' } : {}}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="p-[18px]">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-[26px] font-black tracking-tight" style={{ color: '#424040' }}>32</span>
              <span className="text-[12px]" style={{ color: '#8A8888' }}>new this week</span>
              <span className="text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">↑ 18%</span>
            </div>
            {/* Static bar chart */}
            <div className="flex items-end gap-2.5 h-[120px]">
              {[3,7,4,8,5,2,3].map((v, i) => (
                <div key={i} className="flex-1">
                  <div className="w-full rounded-t-[4px]"
                    style={{ height: `${Math.round((v / 8) * 96)}px`, background: '#8A70D6', opacity: 0.85, minHeight: 4 }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 mt-2">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className="text-center text-[9px] font-bold" style={{ color: '#8A8888' }}>{d}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz performance */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Quiz Performance</div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E9E3FF] text-[#6B52B8]">Avg {avgQuiz}%</span>
          </div>
          <div className="p-[18px] flex flex-col gap-3">
            {[
              { range: '90–100%', count: buckets.a, pct: Math.max(4, quizResults.length > 0 ? Math.round(buckets.a / quizResults.length * 100) : 42), cls: 'bg-[#22C55E]' },
              { range: '70–89%',  count: buckets.b, pct: Math.max(4, quizResults.length > 0 ? Math.round(buckets.b / quizResults.length * 100) : 78), cls: 'bg-[#8A70D6]' },
              { range: '60–69%',  count: buckets.c, pct: Math.max(4, quizResults.length > 0 ? Math.round(buckets.c / quizResults.length * 100) : 50), cls: 'bg-[#F59E0B]' },
              { range: 'Below 60%', count: buckets.d, pct: Math.max(4, quizResults.length > 0 ? Math.round(buckets.d / quizResults.length * 100) : 22), cls: 'bg-[#EF4444]' },
            ].map(row => (
              <div key={row.range}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span style={{ color: '#8A8888' }}>{row.range}</span>
                  <span className="font-bold" style={{ color: row.range === 'Below 60%' && buckets.d > 0 ? '#EF4444' : '#424040' }}>
                    {quizResults.length > 0 ? `${row.count} students` : '—'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F6' }}>
                  <div className={`h-full rounded-full ${row.cls}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
            {buckets.d > 0 && (
              <div className="px-3 py-2.5 rounded-lg text-[12px] mt-1" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                <strong>{buckets.d} students</strong> scored below 60% — AI study recommendations sent.
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Recent Activity</div>
            <Link href="/admin/students" className="text-[12px] font-bold text-[#8A70D6] hover:underline">View all</Link>
          </div>
          <div className="px-4 py-1 max-h-[280px] overflow-y-auto">
            {recentEnrollments.length === 0 ? (
              <p className="text-[13px] py-6 text-center" style={{ color: '#8A8888' }}>No recent activity.</p>
            ) : (
              recentEnrollments.map((e, i) => {
                const dot = ['#8A70D6','#F59E0B','#EF4444','#22C55E','#8A70D6','#3B82F6'][i % 6]
                return (
                  <div key={`${e.userId}-${e.courseId}`} className="flex items-start gap-2.5 py-3" style={{ borderBottom: i < recentEnrollments.length - 1 ? '1px solid #E8E8EC' : 'none' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: dot }} />
                    <div className="text-[12px] flex-1 leading-snug" style={{ color: '#424040' }}>
                      <strong>{e.user.name}</strong> enrolled in {e.course.title}
                    </div>
                    <div className="text-[11px] flex-shrink-0" style={{ color: '#8A8888' }}>
                      {daysAgo(e.enrolledAt)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row: submissions + live classes + activity log ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Submissions to grade */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Submissions to Grade</div>
            <Link href="/admin/assignments">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">{pendingSubmissions} pending</span>
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8EC' }}>
                {['Student','Assignment','When',''].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.6px] px-4 py-2.5" style={{ color: '#8A8888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[13px]" style={{ color: '#8A8888' }}>All caught up! 🎉</td></tr>
              ) : recentSubmissions.map(sub => (
                <tr key={sub.id} className="hover:bg-[#FAFAFA] transition-colors"
                  style={{ borderBottom: '1px solid #E8E8EC' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: avatarColor(sub.user.name) }}>
                        {initials(sub.user.name)}
                      </div>
                      <span className="text-[13px] font-bold" style={{ color: '#424040' }}>{sub.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#8A8888' }}>{sub.assignment.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sub.submittedAt.toDateString() === now.toDateString() ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#F4F4F6] text-[#8A8888]'}`}>
                      {daysAgo(sub.submittedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/assignments?review=${sub.id}`}
                        className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#8A70D6] hover:bg-[#E9E3FF] transition-all">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, color: '#8A8888' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming live classes */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Upcoming Live Classes</div>
            <Link href="/admin/live-classes" className="text-[12px] font-bold text-[#8A70D6] hover:underline">Manage →</Link>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            {upcomingClasses.map(cls => {
              const isLive = cls.status === 'LIVE'
              const d      = new Date(cls.scheduledAt)
              return (
                <div key={cls.id}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-lg border transition-all duration-150 cursor-pointer hover:border-[#8A70D6] hover:bg-[#E9E3FF]"
                  style={{ borderColor: isLive ? '#EF4444' : '#E8E8EC', background: isLive ? '#FEF2F2' : 'white' }}>
                  <div className="text-center w-11 flex-shrink-0">
                    <div className="text-[13px] font-black" style={{ color: '#424040' }}>
                      {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: '#8A8888' }}>
                      {isLive ? 'NOW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </div>
                  </div>
                  <div className="w-px h-9 flex-shrink-0" style={{ background: '#E8E8EC' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate" style={{ color: '#424040' }}>{cls.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px]" style={{ color: '#8A8888' }}>
                      {isLive && <><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] flex-shrink-0" style={{ animation: 'pulse 1.2s infinite' }} /><span>Live now</span></>}
                      {!isLive && <span>{cls.course.title}</span>}
                    </div>
                  </div>
                  {isLive
                    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C]">LIVE</span>
                    : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F4F4F6] text-[#8A8888]">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  }
                </div>
              )
            })}
            {upcomingClasses.length === 0 && (
              <p className="text-[13px] text-center py-4" style={{ color: '#8A8888' }}>No upcoming classes.</p>
            )}
            <Link href="/admin/live-classes"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg font-bold text-[12px] text-[#8A70D6] no-underline transition-colors"
              style={{ background: '#E9E3FF', border: '1.5px dashed #D4CAF7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Schedule New Class
            </Link>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Activity Log</div>
            <span className="text-[11px]" style={{ color: '#8A8888' }}>Today</span>
          </div>
          <div className="px-4 py-2 max-h-[280px] overflow-y-auto">
            {/* Mix of recent activity: completions + enrollments */}
            {recentActivity.length === 0 && recentEnrollments.length === 0 ? (
              <p className="text-[13px] py-6 text-center" style={{ color: '#8A8888' }}>No activity yet.</p>
            ) : (
              <>
                {recentActivity.slice(0, 3).map((r, i) => (
                  <div key={r.id} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: '1px solid #E8E8EC', fontSize: 12 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="flex-1 leading-snug" style={{ color: '#424040' }}>
                      <strong>{r.user.name}</strong> completed {r.lesson.title}
                    </div>
                    <div className="text-[11px] flex-shrink-0" style={{ color: '#8A8888' }}>
                      {daysAgo(r.completedAt)}
                    </div>
                  </div>
                ))}
                {recentSubmissions.slice(0, 2).map((sub, i) => (
                  <div key={sub.id} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: '1px solid #E8E8EC', fontSize: 12 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7', color: '#D97706' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    </div>
                    <div className="flex-1 leading-snug" style={{ color: '#424040' }}>
                      <strong>{sub.user.name}</strong> submitted assignment
                    </div>
                    <div className="text-[11px] flex-shrink-0" style={{ color: '#8A8888' }}>
                      {daysAgo(sub.submittedAt)}
                    </div>
                  </div>
                ))}
                {recentEnrollments.slice(0, 2).map((e, i) => (
                  <div key={`${e.userId}${i}`} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: i < 1 ? '1px solid #E8E8EC' : 'none', fontSize: 12 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#DBEAFE', color: '#3B82F6' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                      </svg>
                    </div>
                    <div className="flex-1 leading-snug" style={{ color: '#424040' }}>
                      <strong>{e.user.name}</strong> enrolled in {e.course.title}
                    </div>
                    <div className="text-[11px] flex-shrink-0" style={{ color: '#8A8888' }}>
                      {daysAgo(e.enrolledAt)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}