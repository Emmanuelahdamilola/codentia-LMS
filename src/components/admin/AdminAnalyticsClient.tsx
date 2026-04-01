// PATH: src/components/admin/AdminAnalyticsClient.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

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

const avatarColors = ['#7C5CDB','#06B6D4','#0EA5E9','#F59E0B','#10B981']

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
  const accent = {
    purple: '#7C5CDB', green: '#16A34A', amber: '#D97706', blue: '#2563EB', red: '#DC2626',
  }[color]
  const iconBg = {
    purple: 'bg-[#EDE8FF] text-[#7C5CDB]',
    green:  'bg-[#DCFCE7] text-[#16A34A]',
    amber:  'bg-[#FEF3C7] text-[#D97706]',
    blue:   'bg-[#EFF6FF] text-[#2563EB]',
    red:    'bg-[#FEE2E2] text-[#DC2626]',
  }[color]
  const deltaBg = {
    up:  'bg-[#DCFCE7] text-[#15803D]',
    down:'bg-[#FEE2E2] text-[#B91C1C]',
    neu: 'bg-[#F4F4F5] text-[#71717A]',
  }[deltaDir]

  return (
    <div className="bg-white rounded-2xl border border-[#E9E7EF] relative overflow-hidden animate-fade-up transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)', paddingTop: 3 }}>
      <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ background: accent }} />
      <div className="p-5 pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${deltaBg}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-semibold leading-none tracking-[-0.03em] mb-1" style={{ color: '#1A1523' }}>{value}</div>
        <div className="text-[12.5px] font-medium" style={{ color: '#9591A8' }}>{label}</div>
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
    <div className="px-7 py-6 pb-16">

      {/* ── Page header + period tabs ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] tracking-tight" style={{ color: '#1A1523' }}>Analytics</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#9591A8' }}>Platform-wide metrics and trends.</div>
        </div>
        {/* Period toggle — tab-bar style exactly like blueprint */}
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: '#F7F7F9', border: '1px solid #E8E8EC' }}>
          {(['30d','90d','ytd'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-md font-bold text-[12px] transition-all duration-150"
              style={{
                background: period === p ? '#fff' : 'transparent',
                color:      period === p ? '#7C5CDB' : '#9591A8',
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
        style={{ background: '#EDE8FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
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
        <div className="bg-white rounded-2xl border border-[#E9E7EF] shadow-[0_2px_8px_rgba(15,13,26,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[14.5px] font-semibold" style={{ color: "#1A1523", letterSpacing: "-0.01em" }}>Enrollment Over Time</div>
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
                      background: '#7C5CDB',
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
                <div key={i} className="text-center text-[9px] font-bold" style={{ color: '#9591A8' }}>{m}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Completion funnel */}
        <div className="bg-white rounded-2xl border border-[#E9E7EF] shadow-[0_2px_8px_rgba(15,13,26,0.06)] overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[14.5px] font-semibold" style={{ color: "#1A1523", letterSpacing: "-0.01em" }}>Completion Funnel</div>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {[
              { label: 'Enrolled',          value: funnel.enrolled,         bar: '#7C5CDB' },
              { label: 'Started a lesson',  value: funnel.startedLesson,    bar: '#7C5CDB' },
              { label: 'Passed first quiz', value: funnel.passedFirstQuiz,  bar: '#7C5CDB' },
              { label: '50%+ course done',  value: funnel.halfwayDone,      bar: '#F59E0B' },
              { label: 'Completed course',  value: funnel.completed,        bar: '#16A34A' },
            ].map(row => {
              const pct = funnel.enrolled > 0 ? Math.round(row.value / funnel.enrolled * 100) : 0
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: '#9591A8' }}>{row.label}</span>
                    <span className="font-bold" style={{ color: row.label === 'Completed course' ? '#16A34A' : '#1A1523' }}>
                      {row.value}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F7F7F9' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.bar }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Course Performance | AI Usage | Leaderboard ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Course Performance table + AI insight */}
        <div className="bg-white rounded-2xl border border-[#E9E7EF] shadow-[0_2px_8px_rgba(15,13,26,0.06)] overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[14.5px] font-semibold" style={{ color: "#1A1523", letterSpacing: "-0.01em" }}>Course Performance</div>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8EC' }}>
                {['Course','Students','Progress','Quiz','Done'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.5px] px-4 py-2.5"
                    style={{ color: '#9591A8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[13px]" style={{ color: '#9591A8' }}>
                    No course data yet.
                  </td>
                </tr>
              ) : (
                courseBreakdown.map(c => (
                  <tr key={c.id}
                    style={{ borderBottom: '1px solid #E8E8EC' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF8FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#1A1523' }}>
                      {/* Truncate long course titles */}
                      {c.title.split(' ').slice(0, 2).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#1A1523' }}>{c.students}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F7F7F9', width: 50 }}>
                          <div className="h-full rounded-full rounded-full" style={{ width: `${c.avgProgress}%`, background: 'var(--color-primary)' }} />
                        </div>
                        <span className="text-[11px]" style={{ color: '#9591A8' }}>{c.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.avgQuiz !== null ? (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.avgQuiz >= 80 ? 'bg-[#DCFCE7] text-[#15803D]' :
                          c.avgQuiz >= 70 ? 'bg-[#EDE8FF] text-[#6146C4]' :
                                            'bg-[#FEF3C7] text-[#B45309]'
                        }`}>
                          {c.avgQuiz}%
                        </span>
                      ) : (
                        <span style={{ color: '#9591A8' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#1A1523' }}>{c.completed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Per-course AI insight */}
          <div className="px-4 py-3" style={{ borderTop: '1px solid #E8E8EC' }}>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed"
              style={{ background: '#EDE8FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
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
        <div className="bg-white rounded-2xl border border-[#E9E7EF] shadow-[0_2px_8px_rgba(15,13,26,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[14.5px] font-semibold" style={{ color: "#1A1523", letterSpacing: "-0.01em" }}>AI Feature Usage</div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FF] text-[#6146C4]">This month</span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[
              { icon: '🤖', label: 'AI Tutor conversations', value: aiUsage.conversations,   pct: 88, bar: 'bg-[#7C5CDB]' },
              { icon: '📋', label: 'Assignment AI reviews',  value: aiUsage.assignments,     pct: 66, bar: 'bg-[#7C5CDB]' },
              { icon: '📚', label: 'Study recommendations', value: aiUsage.recommendations, pct: 24, bar: 'bg-[#F59E0B]' },
              { icon: '✨', label: 'AI-generated quizzes',  value: aiUsage.quizzes,          pct: 10, bar: 'bg-[#7C5CDB]' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="flex items-center gap-1.5" style={{ color: '#9591A8' }}>
                    <span>{row.icon}</span>{row.label}
                  </span>
                  <span className="font-bold" style={{ color: '#1A1523' }}>
                    {row.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F7F7F9' }}>
                  <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}

            <div className="px-3 py-2.5 rounded-lg text-[12px] text-[#7C5CDB]" style={{ background: '#EDE8FF' }}>
              <strong>63%</strong> of at-risk students acted on AI study recommendations within 48h.
            </div>
          </div>
        </div>

        {/* 🏆 Leaderboard */}
        <div className="bg-white rounded-2xl border border-[#E9E7EF] shadow-[0_2px_8px_rgba(15,13,26,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E8E8EC' }}>
            <div className="text-[14.5px] font-semibold" style={{ color: "#1A1523", letterSpacing: "-0.01em" }}>🏆 Top Students This Week</div>
            <span className="text-[11px]" style={{ color: '#9591A8' }}>by points</span>
          </div>
          <div className="px-4 py-2">
            {topStudents.length === 0 ? (
              <p className="text-[13px] py-6 text-center" style={{ color: '#9591A8' }}>No data yet.</p>
            ) : (
              topStudents.map((s, i) => {
                const rankIcon  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)
                const rankColor = i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#9591A8'
                return (
                  <div key={s.name}
                    className="flex items-center gap-2.5 py-2"
                    style={{ borderBottom: i < topStudents.length - 1 ? '1px solid #E8E8EC' : 'none' }}>
                    {/* Rank */}
                    <span className="w-5 text-center text-[14px] font-bold flex-shrink-0"
                      style={{ color: rankColor }}>
                      {rankIcon}
                    </span>
                    {/* Avatar */}
                    <div
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: avatarColors[i % avatarColors.length] }}>
                      {s.initials}
                    </div>
                    {/* Name */}
                    <div className="text-[12px] font-bold flex-1 truncate" style={{ color: '#1A1523' }}>
                      {s.name}
                    </div>
                    {/* Points */}
                    <span className="text-[12px] font-bold flex-shrink-0" style={{ color: '#7C5CDB' }}>
                      {s.points} pts
                    </span>
                  </div>
                )
              })
            )}

            <div className="mt-3 px-3 py-2.5 rounded-lg text-[11px] text-center" style={{ background: '#F7F7F9', color: '#9591A8' }}>
              Points earned from lessons, quizzes, assignments &amp; live attendance
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
