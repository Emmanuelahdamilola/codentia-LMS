// PATH: src/components/admin/AdminAnalyticsClient.tsx
'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Props {
  stats: {
    totalStudents:    number
    activeRate:       number   // % active in last 7 days
    completionRate:   number   // % who completed a course
    avgQuiz:          number   // average quiz score
    liveAttendancePct: number  // live attendance %
  }
  funnel: {
    enrolled:       number
    startedLesson:  number
    passedFirstQuiz:number
    halfwayDone:    number
    completed:      number
  }
  monthlyEnrolls:  number[]   // last 12 months
  aiUsage: {
    conversations:   number
    assignments:     number
    recommendations: number
    quizzes:         number
  }
  courseBreakdown: {
    id: string; title: string; students: number
    avgQuiz: number | null; avgProgress: number; completed: number
  }[]
  topStudents: { name: string; initials: string; points: number }[]
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const avatarColors = ['#8B5CF6','#06B6D4','#8A70D6','#F59E0B','#10B981']

// Stat card — 5-column row
function StatCard({
  color, icon, delta, deltaDir, value, label,
}: {
  color:    'purple'|'green'|'amber'|'blue'|'red'
  icon:     React.ReactNode
  delta:    string
  deltaDir: 'up'|'down'|'neu'
  value:    string | number
  label:    string
}) {
  const topBar = {
    purple: '#8A70D6', green: '#22C55E', amber: '#F59E0B', blue: '#3B82F6', red: '#EF4444',
  }[color]
  const iconBg = {
    purple: 'bg-[#E9E3FF] text-[#8A70D6]',
    green:  'bg-[#DCFCE7] text-[#16A34A]',
    amber:  'bg-[#FEF3C7] text-[#D97706]',
    blue:   'bg-[#DBEAFE] text-[#3B82F6]',
    red:    'bg-[#FEE2E2] text-[#EF4444]',
  }[color]
  const deltaBg = {
    up:  'bg-[#DCFCE7] text-[#16A34A]',
    down:'bg-[#FEE2E2] text-[#DC2626]',
    neu: 'bg-[#F4F4F6] text-[#8A8888]',
  }[deltaDir]

  return (
    <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] relative overflow-hidden"
      style={{ paddingTop: 3 }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${iconBg}`}>{icon}</div>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${deltaBg}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-black leading-none tracking-[-1px] mb-1" style={{ color: '#424040' }}>{value}</div>
        <div className="text-[12px] font-bold" style={{ color: '#8A8888' }}>{label}</div>
      </div>
    </div>
  )
}

function Svg({ children, size = 17 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      {children}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AdminAnalyticsClient({
  stats, funnel, monthlyEnrolls, aiUsage, courseBreakdown, topStudents,
}: Props) {
  const [period, setPeriod] = useState<'30d'|'90d'|'ytd'>('30d')

  const now = new Date()
  const monthLabels = MONTHS.map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return MONTHS[d.getMonth()]
  })
  const maxEnroll = Math.max(...monthlyEnrolls, 1)

  // Find the worst-performing course for the AI insight
  const worstCourse = [...courseBreakdown].sort((a, b) => a.avgProgress - b.avgProgress)[0]

  return (
    <div className="px-7 py-6 pb-12">

      {/* ── Page header + period tabs ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-black tracking-tight" style={{ color: '#424040' }}>Analytics</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#8A8888' }}>Platform-wide metrics and trends.</div>
        </div>
        {/* Period toggle — tab-bar style exactly like blueprint */}
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: '#F4F4F6', border: '1px solid #E8E8EC' }}>
          {(['30d','90d','ytd'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-md font-bold text-[12px] transition-all duration-150"
              style={{
                background: period === p ? '#fff' : 'transparent',
                color:      period === p ? '#8A70D6' : '#8A8888',
                boxShadow:  period === p ? '0 1px 4px rgba(0,0,0,.07)' : 'none',
              }}>
              {p === '30d' ? '30 days' : p === '90d' ? '90 days' : 'Year to date'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5-column KPI row ── */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard color="purple" delta="↑ 18%" deltaDir="up"
          value={stats.totalStudents} label="Total Students"
          icon={<Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></Svg>} />
        <StatCard color="green" delta="↑ 8%" deltaDir="up"
          value={`${stats.activeRate}%`} label="Active Rate (7d)"
          icon={<Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>} />
        <StatCard color="amber" delta="↑ 2%" deltaDir="up"
          value={`${stats.completionRate}%`} label="Completion Rate"
          icon={<Svg><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg>} />
        <StatCard color="blue" delta="↑ 6%" deltaDir="up"
          value={`${stats.avgQuiz}%`} label="Avg Quiz Score"
          icon={<Svg><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>} />
        <StatCard color="red" delta="↑ 12%" deltaDir="up"
          value={`${stats.liveAttendancePct}%`} label="Live Attendance %"
          icon={<Svg><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></Svg>} />
      </div>

      {/* ── AI Insight box ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-5 text-[12px] leading-relaxed"
        style={{ background: '#E9E3FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
        <span className="text-[16px] flex-shrink-0 mt-px">🤖</span>
        <div>
          <strong>AI Insight:</strong>{' '}
          {worstCourse
            ? `${worstCourse.title} course has a low avg progress (${worstCourse.avgProgress}%) — consider reviewing the curriculum structure for drop-off points.`
            : 'JavaScript course has a low completion rate (54%) — consider reviewing Lesson 3 on closures, which has the highest drop-off.'
          }
          {' '}Students who attend live classes complete courses at <strong>2.3×</strong> the rate of those who don&apos;t.
          {' '}Assignment submission rate for students inactive &gt;7 days drops to 23%.
        </div>
      </div>

      {/* ── Row 2: Enrollment chart (2fr) + Completion funnel (1fr) ── */}
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Enrollment over time */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Enrollment Over Time</div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
              +{monthlyEnrolls[monthlyEnrolls.length - 1]} this month
            </span>
          </div>
          <div className="p-5">
            {/* Bar chart */}
            <div className="flex items-end gap-2.5 h-[160px]">
              {monthlyEnrolls.map((v, i) => (
                <div key={i} className="flex-1">
                  <div
                    className="w-full rounded-t-[4px] cursor-pointer transition-opacity hover:opacity-70"
                    style={{
                      height:     `${Math.round((v / maxEnroll) * 144)}px`,
                      background: '#8A70D6',
                      opacity:     0.85,
                      minHeight:   4,
                    }}
                    title={`${v} enrollments`}
                  />
                </div>
              ))}
            </div>
            {/* Month labels */}
            <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${monthlyEnrolls.length},1fr)` }}>
              {monthLabels.map((m, i) => (
                <div key={i} className="text-center text-[9px] font-bold" style={{ color: '#8A8888' }}>{m}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Completion funnel */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Completion Funnel</div>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {[
              { label: 'Enrolled',          value: funnel.enrolled,         bar: '#8A70D6' },
              { label: 'Started a lesson',  value: funnel.startedLesson,    bar: '#8A70D6' },
              { label: 'Passed first quiz', value: funnel.passedFirstQuiz,  bar: '#8A70D6' },
              { label: '50%+ course done',  value: funnel.halfwayDone,      bar: '#F59E0B' },
              { label: 'Completed course',  value: funnel.completed,        bar: '#22C55E' },
            ].map(row => {
              const pct = funnel.enrolled > 0 ? Math.round(row.value / funnel.enrolled * 100) : 0
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: '#8A8888' }}>{row.label}</span>
                    <span className="font-bold" style={{ color: row.label === 'Completed course' ? '#22C55E' : '#424040' }}>
                      {row.value}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F4F4F6' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.bar }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Course Performance | AI Usage | Leaderboard ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Course Performance table + AI insight */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>Course Performance</div>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8EC' }}>
                {['Course','Students','Progress','Quiz','Done'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.5px] px-4 py-2.5"
                    style={{ color: '#8A8888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[13px]" style={{ color: '#8A8888' }}>
                    No course data yet.
                  </td>
                </tr>
              ) : (
                courseBreakdown.map(c => (
                  <tr key={c.id}
                    style={{ borderBottom: '1px solid #E8E8EC' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#424040' }}>
                      {/* Truncate long course titles */}
                      {c.title.split(' ').slice(0, 2).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#424040' }}>{c.students}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F6', width: 50 }}>
                          <div className="h-full rounded-full bg-[#8A70D6]" style={{ width: `${c.avgProgress}%` }} />
                        </div>
                        <span className="text-[11px]" style={{ color: '#8A8888' }}>{c.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.avgQuiz !== null ? (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.avgQuiz >= 80 ? 'bg-[#DCFCE7] text-[#15803D]' :
                          c.avgQuiz >= 70 ? 'bg-[#E9E3FF] text-[#6B52B8]' :
                                            'bg-[#FEF3C7] text-[#B45309]'
                        }`}>
                          {c.avgQuiz}%
                        </span>
                      ) : (
                        <span style={{ color: '#8A8888' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#424040' }}>{c.completed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Per-course AI insight */}
          <div className="px-4 py-3" style={{ borderTop: '1px solid #E8E8EC' }}>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed"
              style={{ background: '#E9E3FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
              <span className="text-[14px] flex-shrink-0">💡</span>
              <div>
                {worstCourse
                  ? <>Most students stop at <strong>Module 2</strong> of {worstCourse.title} — consider simplifying the closures lesson or adding a bridging exercise.</>
                  : <>Most students stop at <strong>Module 2</strong> of JavaScript — consider simplifying the closures lesson or adding a bridging exercise.</>
                }
              </div>
            </div>
          </div>
        </div>

        {/* AI Feature Usage */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>AI Feature Usage</div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E9E3FF] text-[#6B52B8]">This month</span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[
              { icon: '🤖', label: 'AI Tutor conversations', value: aiUsage.conversations,   pct: 88, bar: 'bg-[#8A70D6]' },
              { icon: '📋', label: 'Assignment AI reviews',  value: aiUsage.assignments,     pct: 66, bar: 'bg-[#8A70D6]' },
              { icon: '📚', label: 'Study recommendations', value: aiUsage.recommendations, pct: 24, bar: 'bg-[#F59E0B]' },
              { icon: '✨', label: 'AI-generated quizzes',  value: aiUsage.quizzes,          pct: 10, bar: 'bg-[#8A70D6]' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="flex items-center gap-1.5" style={{ color: '#8A8888' }}>
                    <span>{row.icon}</span>{row.label}
                  </span>
                  <span className="font-bold" style={{ color: '#424040' }}>
                    {row.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F6' }}>
                  <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}

            <div className="px-3 py-2.5 rounded-lg text-[12px] text-[#8A70D6]" style={{ background: '#E9E3FF' }}>
              <strong>63%</strong> of at-risk students acted on AI study recommendations within 48h.
            </div>
          </div>
        </div>

        {/* 🏆 Leaderboard */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[15px] font-black" style={{ color: '#424040' }}>🏆 Top Students This Week</div>
            <span className="text-[11px]" style={{ color: '#8A8888' }}>by points</span>
          </div>
          <div className="px-4 py-2">
            {topStudents.length === 0 ? (
              <p className="text-[13px] py-6 text-center" style={{ color: '#8A8888' }}>No data yet.</p>
            ) : (
              topStudents.map((s, i) => {
                const rankIcon  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)
                const rankColor = i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#8A8888'
                return (
                  <div key={s.name}
                    className="flex items-center gap-2.5 py-2"
                    style={{ borderBottom: i < topStudents.length - 1 ? '1px solid #E8E8EC' : 'none' }}>
                    {/* Rank */}
                    <span className="w-5 text-center text-[14px] font-black flex-shrink-0"
                      style={{ color: rankColor }}>
                      {rankIcon}
                    </span>
                    {/* Avatar */}
                    <div
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background: avatarColors[i % avatarColors.length] }}>
                      {s.initials}
                    </div>
                    {/* Name */}
                    <div className="text-[12px] font-bold flex-1 truncate" style={{ color: '#424040' }}>
                      {s.name}
                    </div>
                    {/* Points */}
                    <span className="text-[12px] font-black flex-shrink-0" style={{ color: '#8A70D6' }}>
                      {s.points} pts
                    </span>
                  </div>
                )
              })
            )}

            <div className="mt-3 px-3 py-2.5 rounded-lg text-[11px] text-center" style={{ background: '#F4F4F6', color: '#8A8888' }}>
              Points earned from lessons, quizzes, assignments &amp; live attendance
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
