// PATH: src/components/admin/AdminAssignmentsClient.tsx
'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Submission {
  id: string
  studentName:     string
  studentEmail:    string
  assignmentTitle: string
  courseTitle:     string
  githubUrl:       string | null
  liveUrl:         string | null
  notes:           string | null
  status:          string
  grade:           number | null
  feedback:        string | null
  submittedAt:     string
  daysAgo:         number
  isLate:          boolean
}

interface Stats {
  pending: number; reviewed: number; late: number; reviewedThisWeek: number
}

interface AssignmentRow {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxScore: number
  lessonId: string
  lessonTitle: string
  courseTitle: string
  courseId: string
  submissions: number
  createdAt: string
}

interface Props {
  submissions: Submission[]
  stats: Stats
  assignments: AssignmentRow[]
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const avatarColors = ['#8B5CF6','#06B6D4','#10B981','#F59E0B','#EF4444','#8A70D6']
const getColor     = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]
const getInitials  = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

function submittedLabel(daysAgo: number) {
  if (daysAgo === 0) return { label: 'Today',     cls: 'bg-[#FEF3C7] text-[#B45309]' }
  if (daysAgo === 1) return { label: 'Yesterday', cls: 'bg-[#FEF3C7] text-[#B45309]' }
  return { label: `${daysAgo} days ago`, cls: 'bg-[#FEE2E2] text-[#B91C1C]' }
}

function courseBadgeCls(title: string) {
  const t = title.toLowerCase()
  if (t.includes('javascript') || t.includes('js')) return 'bg-[#E9E3FF] text-[#6B52B8]'
  if (t.includes('react'))   return 'bg-[#DBEAFE] text-[#1D4ED8]'
  if (t.includes('html') || t.includes('css')) return 'bg-[#DBEAFE] text-[#1D4ED8]'
  return 'bg-[#F4F4F6] text-[#8A8888]'
}

function statusBadge(status: string, isLate: boolean) {
  if (isLate && status === 'PENDING') return { label: 'Late',    bg: '#FEE2E2', text: '#B91C1C' }
  if (status === 'PENDING')           return { label: 'Pending', bg: '#FEF3C7', text: '#B45309' }
  if (status === 'GRADED')            return { label: 'Reviewed',bg: '#DCFCE7', text: '#15803D' }
  return { label: status.replace(/_/g, ' '), bg: '#DBEAFE', text: '#1D4ED8' }
}

function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Review Panel
// ─────────────────────────────────────────────────────────────
function ReviewPanel({ sub, onClose, onSubmit }: {
  sub: Submission; onClose: () => void; onSubmit: (score: number, feedback: string) => void
}) {
  const [score,    setScore]    = useState(sub.grade ?? 8)
  const [feedback, setFeedback] = useState(
    sub.feedback ?? 'Great work on implementing all the required features! Focus on improving error handling for edge cases and test on mobile devices.'
  )

  return (
    <div className="flex-shrink-0" style={{ width: 380 }}>
      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8EC]">
          <div className="text-[14px] font-black" style={{ color: '#424040' }}>Review Assignment</div>
          <button onClick={onClose}
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px] border border-[#E8E8EC]"
            style={{ background: '#F4F4F6', color: '#8A8888' }}>✕</button>
        </div>

        <div className="p-4 flex flex-col gap-3.5">

          {/* Student header */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black text-white flex-shrink-0"
              style={{ background: getColor(sub.studentName) }}>
              {getInitials(sub.studentName)}
            </div>
            <div>
              <div className="text-[14px] font-black" style={{ color: '#424040' }}>{sub.studentName}</div>
              <div className="text-[12px]" style={{ color: '#8A8888' }}>{sub.assignmentTitle}</div>
            </div>
          </div>

          {/* Submission links */}
          <div className="flex gap-2">
            {sub.githubUrl ? (
              <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#E8E8EC] text-[12px] font-bold hover:border-[#8A70D6] transition-colors"
                style={{ background: '#F4F4F6', color: '#424040' }}>
                <Svg size={13}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></Svg>
                GitHub Repo
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center py-2 rounded-lg border border-[#E8E8EC] text-[12px] text-[#8A8888]"
                style={{ background: '#F4F4F6' }}>No GitHub link</div>
            )}
            {sub.liveUrl ? (
              <a href={sub.liveUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#E8E8EC] text-[12px] font-bold hover:border-[#8A70D6] transition-colors"
                style={{ background: '#F4F4F6', color: '#424040' }}>
                <Svg size={13}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Svg>
                Live Demo
              </a>
            ) : null}
          </div>

          {/* Student notes */}
          {sub.notes && (
            <div className="rounded-lg p-3" style={{ background: '#F4F4F6' }}>
              <div className="text-[11px] font-bold uppercase tracking-[.5px] mb-1.5" style={{ color: '#8A8888' }}>Student Notes</div>
              <div className="text-[12px] leading-relaxed" style={{ color: '#424040' }}>{sub.notes}</div>
            </div>
          )}

          {/* AI Quick Assessment */}
          <div className="rounded-lg p-3" style={{ background: 'linear-gradient(135deg,#8A70D6,#6B52B8)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[14px]">🤖</span>
              <div className="text-[12px] font-bold text-white">AI Quick Assessment</div>
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,.85)' }}>
              ✅ Core requirements implemented<br/>
              ✅ Code structure looks clean<br/>
              {sub.githubUrl && '✅ GitHub repository provided\n'}
              ⚠️ Error handling could be more robust<br/>
              ⚠️ Mobile responsiveness worth testing
            </div>
            <div className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,.6)' }}>
              AI suggests: {score}/10 — {score >= 8 ? 'Good work overall' : score >= 6 ? 'Solid effort' : 'Needs improvement'}
            </div>
          </div>

          {/* Score */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>
              Score (out of 10)
            </label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={10} value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="rounded-lg px-3 py-2 text-[13px] outline-none"
                style={{ width: 80, border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }} />
              <span className="text-[12px]" style={{ color: '#8A8888' }}>/ 10</span>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>
              Written Feedback
            </label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-y"
              style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040', minHeight: 100 }} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => onSubmit(score, feedback)}
              className="flex-1 py-2.5 rounded-lg font-bold text-[12px] text-white transition-colors"
              style={{ background: '#22C55E' }}>
              Submit Review
            </button>
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-bold text-[12px] border border-[#E8E8EC] transition-colors"
              style={{ background: '#F4F4F6', color: '#424040' }}>
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AdminAssignmentsClient({ submissions, stats, assignments }: Props) {
  const [filter,   setFilter]   = useState<'all'|'pending'|'reviewed'|'late'>('all')
  const [selected, setSelected] = useState<Submission | null>(null)
  const [toast,    setToast]    = useState('')
  const [localSubs, setLocalSubs] = useState(submissions)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const filtered = localSubs.filter(s => {
    if (filter === 'pending')  return s.status === 'PENDING' && !s.isLate
    if (filter === 'reviewed') return s.status !== 'PENDING'
    if (filter === 'late')     return s.isLate
    return true
  })

  const handleSubmitReview = (score: number, feedback: string) => {
    if (!selected) return
    setLocalSubs(prev => prev.map(s =>
      s.id === selected.id ? { ...s, status: 'GRADED', grade: score, feedback } : s
    ))
    setSelected(null)
    showToast('Review submitted ✓')
  }

  const pendingCount  = localSubs.filter(s => s.status === 'PENDING').length
  const reviewedCount = localSubs.filter(s => s.status !== 'PENDING').length
  const lateCount     = localSubs.filter(s => s.isLate).length

  return (
    <div className="px-7 py-6 pb-12">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-black tracking-tight" style={{ color: '#424040' }}>Assignment Review</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#8A8888' }}>
            {pendingCount} pending · {stats.reviewedThisWeek} reviewed this week
          </div>
        </div>
        <button onClick={() => showToast('CSV export started')}
          className="flex items-center gap-1.5 px-4 font-bold text-[12px] text-white rounded-lg transition-colors hover:bg-[#6B52B8]"
          style={{ height: 34, background: '#8A70D6' }}>
          <Svg size={13}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
          Export Results
        </button>
      </div>

      {/* ── Assignments summary bar ── */}
      {assignments.length > 0 && (
        <div className="mb-5 p-4 bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)]">
          <div className="text-[11px] font-bold uppercase tracking-[.5px] mb-3" style={{ color: '#8A8888' }}>
            All Assignments ({assignments.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8E8EC] bg-[#F4F4F6]">
                <span className="text-[12px] font-bold" style={{ color: '#424040' }}>{a.title}</span>
                <span className="text-[11px]" style={{ color: '#8A8888' }}>{a.courseTitle.split(' ')[0]}</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#E9E3FF] text-[#6B52B8]">
                  {a.submissions} submitted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter pills + Export ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex gap-1.5">
          {[
            { key: 'all',      label: `All (${localSubs.length})` },
            { key: 'pending',  label: `Pending (${pendingCount})` },
            { key: 'reviewed', label: `Reviewed (${reviewedCount})` },
            { key: 'late',     label: `Late (${lateCount})` },
          ].map(p => (
            <button key={p.key} onClick={() => setFilter(p.key as any)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150"
              style={{
                background:  filter === p.key ? '#8A70D6' : '#fff',
                color:       filter === p.key ? '#fff'    : '#8A8888',
                borderColor: filter === p.key ? '#8A70D6' : '#E8E8EC',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={() => showToast('Export started')}
          className="ml-auto flex items-center gap-1.5 px-3 font-bold text-[12px] text-white rounded-lg transition-colors hover:bg-[#6B52B8]"
          style={{ height: 34, background: '#8A70D6' }}>
          <Svg size={13}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
          Export
        </button>
      </div>

      {/* ── Main layout: table + panel ── */}
      <div className="flex gap-5">

        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[13px]" style={{ color: '#8A8888' }}>
                No submissions match this filter.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E8E8EC' }}>
                    {['Student','Assignment','Course','Submitted','Links','Status',''].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.6px] px-4 py-3"
                        style={{ color: '#8A8888' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const sub = submittedLabel(s.daysAgo)
                    const stat = statusBadge(s.status, s.isLate)
                    return (
                      <tr key={s.id} className="group transition-colors cursor-default"
                        style={{ borderBottom: '1px solid #E8E8EC' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                              style={{ background: getColor(s.studentName) }}>
                              {getInitials(s.studentName)}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold" style={{ color: '#424040' }}>{s.studentName}</div>
                              <div className="text-[11px]" style={{ color: '#8A8888' }}>{s.studentEmail}</div>
                            </div>
                          </div>
                        </td>

                        {/* Assignment */}
                        <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#424040' }}>
                          {s.assignmentTitle}
                        </td>

                        {/* Course */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${courseBadgeCls(s.courseTitle)}`}>
                            {s.courseTitle.split(' ')[0]}
                          </span>
                        </td>

                        {/* Submitted */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sub.cls}`}>
                            {sub.label}
                          </span>
                        </td>

                        {/* Links */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {s.githubUrl && (
                              <a href={s.githubUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8] hover:opacity-80 transition-opacity"
                                onClick={e => e.stopPropagation()}>
                                GitHub
                              </a>
                            )}
                            {s.liveUrl && (
                              <a href={s.liveUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] hover:opacity-80 transition-opacity"
                                onClick={e => e.stopPropagation()}>
                                Live
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: stat.bg, color: stat.text }}>
                            {stat.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelected(s)}
                              className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#8A70D6] hover:bg-[#E9E3FF] transition-all"
                              title="Review">
                              <Svg size={12}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Review Panel */}
        {selected && (
          <ReviewPanel
            sub={selected}
            onClose={() => setSelected(null)}
            onSubmit={handleSubmitReview}
          />
        )}
      </div>

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