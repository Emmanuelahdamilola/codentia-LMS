// PATH: src/components/admin/AdminStudentsClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Student {
  id: string; name: string; email: string
  courses:          { id: string; title: string }[]
  courseCount:      number
  progress:         number
  quizCount:        number
  avgQuiz:          number | null
  recentQuizzes:    { title: string; score: number }[]
  lastActive:       number | null
  status:           'active' | 'at-risk' | 'inactive' | 'completed'
  assignmentsLabel: string
  liveAttended:     number
  totalLive:        number
  createdAt:        string
}

interface Stats {
  totalStudents:  number
  newThisMonth:   number
  activeThisWeek: number
  atRiskCount:    number
  completedCount: number
}

interface Props { students: Student[]; stats: Stats }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const avatarColors = ['#8B5CF6','#06B6D4','#10B981','#F59E0B','#EF4444','#8A70D6']
const getColor     = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]
const getInitials  = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const statusBadge: Record<string, { label: string; bg: string; text: string }> = {
  active:    { label: 'Active',    bg: '#DCFCE7', text: '#15803D' },
  'at-risk': { label: 'At risk',   bg: '#FEF3C7', text: '#B45309' },
  inactive:  { label: 'Inactive',  bg: '#F4F4F6', text: '#8A8888' },
  completed: { label: 'Completed', bg: '#DCFCE7', text: '#15803D' },
}

const coursePillColor = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('javascript') || t.includes('js')) return { bg: '#E9E3FF', text: '#6B52B8' }
  if (t.includes('react'))   return { bg: '#DBEAFE', text: '#1D4ED8' }
  if (t.includes('html') || t.includes('css')) return { bg: '#DBEAFE', text: '#1D4ED8' }
  if (t.includes('python'))  return { bg: '#DCFCE7', text: '#15803D' }
  if (t.includes('node'))    return { bg: '#F4F4F6', text: '#8A8888' }
  return { bg: '#F4F4F6', text: '#8A8888' }
}

function Svg({ children, size = 17 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

function StatCard({ color, icon, delta, deltaDir, value, label }: {
  color: 'purple'|'green'|'amber'|'red'
  icon: React.ReactNode; delta: string; deltaDir: 'up'|'neu'
  value: string|number; label: string
}) {
  const topBar = { purple:'#8A70D6', green:'#22C55E', amber:'#F59E0B', red:'#EF4444' }[color]
  const iconBg = {
    purple:'bg-[#E9E3FF] text-[#8A70D6]', green:'bg-[#DCFCE7] text-[#16A34A]',
    amber: 'bg-[#FEF3C7] text-[#D97706]', red:  'bg-[#FEE2E2] text-[#EF4444]',
  }[color]
  const deltaCls = deltaDir === 'up'
    ? 'bg-[#DCFCE7] text-[#16A34A]'
    : 'bg-[#F4F4F6] text-[#8A8888]'
  return (
    <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] relative overflow-hidden" style={{ paddingTop: 3 }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${iconBg}`}>{icon}</div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${deltaCls}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-black leading-none tracking-[-1px] mb-1" style={{ color: '#424040' }}>{value}</div>
        <div className="text-[12px] font-bold" style={{ color: '#8A8888' }}>{label}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function AdminStudentsClient({ students, stats }: Props) {
  const [search,    setSearch]    = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected,  setSelected]  = useState<Student | null>(null)
  const [toast,     setToast]     = useState('')
  const [confirm,   setConfirm]   = useState<{ msg: string; label: string; color: string; cb: () => void } | null>(null)
  const [notes,     setNotes]     = useState('')

  const showToast   = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const courseOptions = [...new Set(students.flatMap(s => s.courses.map(c => c.title)))]

  const filtered = students.filter(s => {
    if (search       && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (courseFilter && !s.courses.some(c => c.title === courseFilter))       return false
    if (statusFilter && s.status !== statusFilter)                            return false
    return true
  })

  const daysAgoLabel = (d: number | null) => {
    if (d === null) return 'Never'
    if (d === 0)    return 'Today'
    if (d === 1)    return 'Yesterday'
    return `${d} days ago`
  }

  return (
    <div className="px-7 py-6 pb-12">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-black tracking-tight" style={{ color: '#424040' }}>Students</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#8A8888' }}>
            {stats.totalStudents} total · {stats.newThisMonth} joined this month
            {stats.atRiskCount > 0 && (
              <> · <span style={{ color: '#EF4444', fontWeight: 700 }}>{stats.atRiskCount} at risk</span></>
            )}
          </div>
        </div>
        <button onClick={() => showToast('Invite link copied to clipboard')}
          className="flex items-center gap-1.5 px-4 font-bold text-[12px] text-white rounded-lg transition-colors hover:bg-[#6B52B8]"
          style={{ height: 34, background: '#8A70D6' }}>
          <Svg size={13}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
          Invite Student
        </button>
      </div>

      {/* ── 4 Stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard color="purple" delta={`+${stats.newThisMonth} this month`} deltaDir="up"
          value={stats.totalStudents} label="Total Students"
          icon={<Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>} />
        <StatCard color="green" delta="Last 7 days" deltaDir="up"
          value={stats.activeThisWeek} label="Active Students"
          icon={<Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>} />
        <StatCard color="amber" delta="Needs attention" deltaDir="neu"
          value={stats.atRiskCount} label="At Risk"
          icon={<Svg><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>} />
        <StatCard color="purple" delta="All time" deltaDir="neu"
          value={stats.completedCount} label="Completed"
          icon={<Svg><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>} />
      </div>

      {/* ── AI Insight ── */}
      {stats.atRiskCount > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-5 text-[12px] leading-relaxed"
          style={{ background: '#E9E3FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
          <span className="text-[16px] flex-shrink-0">🤖</span>
          <div>
            <strong>AI Student Insights:</strong> {stats.atRiskCount} students are at risk — they have been inactive for 5+ days and scored below 60%. AI study recommendations have been auto-sent to these students.
          </div>
        </div>
      )}

      {/* ── Filters + table ── */}
      <div className="flex gap-5">

        {/* Left: filters + table */}
        <div className="flex-1 min-w-0">

          {/* Filter toolbar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-1.5 px-3 rounded-lg"
              style={{ height: 34, border: '1px solid #E8E8EC', background: '#fff', width: 200 }}>
              <Svg size={13}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                className="flex-1 border-none bg-transparent outline-none text-[13px]"
                style={{ color: '#424040' }} />
            </div>
            {/* Course filter */}
            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
              className="border rounded-lg px-3 text-[12px] outline-none cursor-pointer"
              style={{ height: 34, borderColor: '#E8E8EC', background: '#fff', color: '#424040' }}>
              <option value="">All courses</option>
              {courseOptions.map(c => <option key={c}>{c}</option>)}
            </select>
            {/* Status filter */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 text-[12px] outline-none cursor-pointer"
              style={{ height: 34, borderColor: '#E8E8EC', background: '#fff', color: '#424040' }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="at-risk">At risk</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
            {/* Export */}
            <button onClick={() => showToast('CSV export started')}
              className="ml-auto flex items-center gap-1.5 px-3 font-bold text-[12px] text-white rounded-lg transition-colors hover:bg-[#6B52B8]"
              style={{ height: 34, background: '#8A70D6' }}>
              <Svg size={13}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E8EC' }}>
                  {['Student','Course(s)','Progress','Quizzes','Assignments','Last Active','Status',''].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.6px] px-4 py-2.5"
                      style={{ color: '#8A8888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-[13px]" style={{ color: '#8A8888' }}>No students found.</td></tr>
                ) : filtered.map(s => {
                  const { label, bg, text } = statusBadge[s.status]
                  const progressFill = s.status === 'at-risk' ? '#F59E0B' : s.status === 'completed' ? '#22C55E' : '#8A70D6'
                  const progressPct  = Math.min(100, s.progress * 3) // rough heuristic
                  return (
                    <tr key={s.id} className="group transition-colors cursor-default"
                      style={{ borderBottom: '1px solid #E8E8EC' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                            style={{ background: getColor(s.name) }}>
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold" style={{ color: '#424040' }}>{s.name}</div>
                            <div className="text-[11px]" style={{ color: '#8A8888' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Courses */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.courses.slice(0, 2).map(c => {
                            const { bg: cbg, text: ct } = coursePillColor(c.title)
                            return (
                              <span key={c.id} className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: cbg, color: ct }}>
                                {c.title.split(' ').slice(0, 1).join(' ')}
                              </span>
                            )
                          })}
                          {s.courseCount > 2 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F4F4F6] text-[#8A8888]">
                              +{s.courseCount - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" style={{ minWidth: 100 }}>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F6' }}>
                            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: progressFill }} />
                          </div>
                          <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#424040' }}>
                            {progressPct}%
                          </span>
                        </div>
                      </td>

                      {/* Quizzes */}
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-bold" style={{ color: '#424040' }}>{s.quizCount}</span>
                        {s.avgQuiz !== null && (
                          <span className="text-[11px] ml-1.5" style={{ color: s.avgQuiz < 60 ? '#EF4444' : '#8A8888' }}>
                            avg {s.avgQuiz}%
                          </span>
                        )}
                      </td>

                      {/* Assignments */}
                      <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#424040' }}>
                        {s.assignmentsLabel}
                      </td>

                      {/* Last active */}
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#8A8888' }}>
                        {daysAgoLabel(s.lastActive)}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: bg, color: text }}>
                          {label}
                        </span>
                      </td>

                      {/* Row actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelected(s)}
                            className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#8A70D6] hover:bg-[#E9E3FF] transition-all">
                            <Svg size={12}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>
                          </button>
                          <button onClick={() => showToast(`Email sent to ${s.name}`)}
                            className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#8A70D6] hover:bg-[#E9E3FF] transition-all">
                            <Svg size={12}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Student profile panel ── */}
        {selected && (
          <div className="flex-shrink-0" style={{ width: 360, animation: 'slideIn .22s ease' }}>
            <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden sticky top-0">

              {/* Purple gradient header */}
              <div className="relative p-5 pb-4"
                style={{ background: 'linear-gradient(135deg,#8A70D6,#6B52B8)' }}>
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-[26px] h-[26px] rounded-full flex items-center justify-center text-[14px] text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,.2)' }}>✕</button>

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[18px] font-black text-white flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,.25)' }}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <div className="text-[16px] font-black text-white">{selected.name}</div>
                    <div className="text-[12px] text-white/70">{selected.email}</div>
                  </div>
                </div>

                {/* 3-stat mini grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Progress', value: `${Math.min(100, selected.progress * 3)}%` },
                    { label: 'Quiz Avg', value: selected.avgQuiz !== null ? `${selected.avgQuiz}%` : '—' },
                    { label: 'Assignments', value: selected.assignmentsLabel },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg p-2 text-center"
                      style={{ background: 'rgba(255,255,255,.15)' }}>
                      <div className="text-[16px] font-black text-white">{stat.value}</div>
                      <div className="text-[10px] text-white/70">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-4 max-h-[calc(100vh-260px)] overflow-y-auto">

                {/* Enrolled courses */}
                <div>
                  <div className="text-[12px] font-bold mb-2" style={{ color: '#424040' }}>Enrolled Courses</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.courses.map(c => {
                      const { bg, text } = coursePillColor(c.title)
                      return (
                        <span key={c.id} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: bg, color: text }}>
                          {c.title}
                        </span>
                      )
                    })}
                    {selected.courses.length === 0 && <span className="text-[12px]" style={{ color: '#8A8888' }}>No enrollments</span>}
                  </div>
                </div>

                {/* Recent quiz scores */}
                <div>
                  <div className="text-[12px] font-bold mb-2" style={{ color: '#424040' }}>Recent Quiz Scores</div>
                  {selected.recentQuizzes.length === 0 ? (
                    <p className="text-[12px]" style={{ color: '#8A8888' }}>No quizzes taken yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {selected.recentQuizzes.map((q, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span style={{ color: '#8A8888' }}>{q.title}</span>
                          <span className="font-bold" style={{
                            color: q.score >= 80 ? '#22C55E' : q.score >= 60 ? '#424040' : '#F59E0B',
                          }}>
                            {q.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live class attendance */}
                <div>
                  <div className="text-[12px] font-bold mb-1.5" style={{ color: '#424040' }}>Live Class Attendance</div>
                  <div className="text-[12px]" style={{ color: '#8A8888' }}>
                    Attended{' '}
                    <strong style={{ color: '#424040' }}>{selected.liveAttended} of {selected.totalLive}</strong>
                    {' '}live sessions this month
                  </div>
                </div>

                {/* AI insight */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed"
                  style={{ background: '#E9E3FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
                  <span className="text-[14px] flex-shrink-0">🤖</span>
                  <div>
                    {selected.status === 'at-risk'
                      ? 'Student is struggling — low quiz scores and inactivity detected. Recommend reaching out directly and suggesting AI study plan.'
                      : selected.status === 'completed'
                      ? 'Student has completed all enrolled courses. Consider recommending advanced courses.'
                      : 'Student is making steady progress. Monitor for any drop-off and encourage live class attendance.'
                    }
                  </div>
                </div>

                {/* Instructor notes */}
                <div>
                  <div className="text-[12px] font-bold mb-1.5" style={{ color: '#424040' }}>Instructor Notes</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Internal notes about this student..."
                    className="w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none"
                    style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040', minHeight: 60 }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => showToast(`Email sent to ${selected.name}`)}
                    className="flex-1 py-2 rounded-lg font-bold text-[12px] text-white transition-colors"
                    style={{ background: '#8A70D6' }}>
                    Email
                  </button>
                  <button onClick={() => showToast('Password reset email sent')}
                    className="flex-1 py-2 rounded-lg font-bold text-[12px] border border-[#E8E8EC] transition-colors"
                    style={{ background: '#F4F4F6', color: '#424040' }}>
                    Reset PW
                  </button>
                  <button onClick={() => setConfirm({ msg: `Suspend ${selected.name}'s account?`, label: 'Suspend', color: '#F59E0B', cb: () => { showToast('Student suspended'); setSelected(null) } })}
                    className="flex-1 py-2 rounded-lg font-bold text-[12px] transition-colors"
                    style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                    Suspend
                  </button>
                </div>
                <button onClick={() => setConfirm({ msg: `Remove ${selected.name} from the platform? This cannot be undone.`, label: 'Remove', color: '#EF4444', cb: () => { showToast('Student removed'); setSelected(null) } })}
                  className="w-full py-2 rounded-lg font-bold text-[12px] transition-colors"
                  style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                  Remove from Platform
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-white rounded-xl p-7 w-[380px] shadow-2xl" style={{ animation: 'pop .18s ease' }}>
            <style>{`@keyframes pop{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <div className="text-[18px] mb-2">⚠️</div>
            <div className="text-[15px] font-black mb-1.5" style={{ color: '#424040' }}>{confirm.label}?</div>
            <div className="text-[13px] mb-5" style={{ color: '#8A8888' }}>{confirm.msg}</div>
            <div className="flex gap-2.5">
              <button onClick={() => { confirm.cb(); setConfirm(null) }}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white"
                style={{ background: confirm.color }}>
                {confirm.label}
              </button>
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E8E8EC]"
                style={{ color: '#424040' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white z-[9999]"
          style={{ background: '#1A1730', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
