// PATH: src/components/admin/AdminLiveClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface LiveClass {
  id: string; title: string; courseTitle: string; instructor: string
  scheduledAt: string; durationMins: number; status: string
  meetingLink: string | null; recordingUrl: string | null; attendance: number
}
interface Course { id: string; title: string }
interface LiveNow {
  id: string; title: string; courseTitle: string
  meetingLink: string | null; attendance: number
}
interface MonthlyStats {
  classesHeld: number; totalAttendees: number; avgAttendance: number
  attendanceRate: number; recordingsReady: number; totalThisMonth: number
  attendanceChart: number[]
}
interface Props {
  courses: Course[]; classes: LiveClass[]
  liveNow: LiveNow | null; monthlyStats: MonthlyStats
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function coursePillCls(title: string) {
  const t = title.toLowerCase()
  if (t.includes('javascript') || t.includes('js')) return 'bg-[#EDE8FF] text-[#6146C4]'
  if (t.includes('react'))   return 'bg-[#DBEAFE] text-[#1D4ED8]'
  if (t.includes('html') || t.includes('css')) return 'bg-[#DBEAFE] text-[#1D4ED8]'
  return 'bg-[#DCFCE7] text-[#15803D]'
}
function statusBadge(status: string) {
  if (status === 'LIVE')      return { label: 'Live now',  bg: '#FEE2E2', text: '#B91C1C' }
  if (status === 'SCHEDULED') return { label: 'Upcoming',  bg: '#F4F4F6', text: '#9591A8' }
  if (status === 'COMPLETED') return { label: 'Completed', bg: '#F4F4F6', text: '#9591A8' }
  if (status === 'CANCELLED') return { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C' }
  return { label: status, bg: '#F4F4F6', text: '#9591A8' }
}
function filterKey(status: string) {
  if (status === 'LIVE')      return 'live'
  if (status === 'SCHEDULED') return 'upcoming'
  return 'past'
}
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Mini Attendance Chart
// ─────────────────────────────────────────────────────────────
function AttendanceChart({ data }: { data: number[] }) {
  if (!data.length) return <div className="text-[11px]" style={{ color: '#9591A8' }}>No data yet.</div>
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1" style={{ height: 48 }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm cursor-pointer transition-colors"
          style={{ height: `${Math.max(4, Math.round((v / max) * 44))}px`, background: '#EDE8FF', minWidth: 4 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#7C5CDB')}
          onMouseLeave={e => (e.currentTarget.style.background = '#EDE8FF')}
          title={`${v} attendees`} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Calendar Grid
// ─────────────────────────────────────────────────────────────
function CalendarGrid({ classes }: { classes: LiveClass[] }) {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const dayMap = new Map<number, string>()
  classes.forEach(c => {
    const d = new Date(c.scheduledAt)
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (!dayMap.has(d.getDate())) dayMap.set(d.getDate(), c.status)
    }
  })
  const firstWeekday = new Date(year, month, 1).getDay()
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {cells.map((day, i) => {
        if (!day) return <div key={i} />
        const status  = dayMap.get(day)
        const isToday = day === now.getDate()
        let bg = 'transparent', color = '#9591A8', fw = '400', border = '1px solid transparent'
        if (status === 'LIVE')      { bg = '#EF4444'; color = '#fff'; fw = '700' }
        else if (isToday)           { bg = '#7C5CDB'; color = '#fff'; fw = '700' }
        else if (status === 'SCHEDULED') { bg = '#EDE8FF'; color = '#6146C4'; border = '1px solid #D4CAF7'; fw = '700' }
        else if (status === 'COMPLETED') { bg = '#DCFCE7'; color = '#15803D'; fw = '700' }
        return (
          <div key={i} style={{ aspectRatio: '1', borderRadius: 5, background: bg, color, border,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: fw }}>
            {day}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Schedule Form — wired to POST /api/admin/live-classes
// ─────────────────────────────────────────────────────────────
function ScheduleForm({ courses, onClose, onSuccess }: {
  courses: Course[]; onClose: () => void; onSuccess: () => void
}) {
  const [title,        setTitle]        = useState('')
  const [courseId,     setCourseId]     = useState(courses[0]?.id ?? '')
  const [date,         setDate]         = useState('')
  const [time,         setTime]         = useState('19:00')
  const [duration,     setDuration]     = useState('60')
  const [meetingLink,  setMeetingLink]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit() {
    if (!title.trim() || !date || !meetingLink.trim()) {
      setError('Title, date and meeting link are required.'); return
    }
    setLoading(true); setError('')
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
      const res = await fetch('/api/admin/live-classes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, courseId, scheduledAt, durationMins: Number(duration), meetingLink }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to schedule class')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8EC]">
        <div className="text-[14px] font-black" style={{ color: '#7C5CDB' }}>Schedule a Class</div>
        <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center border border-[#E8E8EC] text-[13px]"
          style={{ background: '#F4F4F6', color: '#9591A8' }}>✕</button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {error && <div className="text-[12px] font-bold px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#EF4444]">{error}</div>}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Session Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Async JavaScript Workshop"
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Course</label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
            style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Duration</label>
          <select value={duration} onChange={e => setDuration(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
            style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }}>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Meeting Link (Zoom / Meet)</label>
          <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
            placeholder="https://zoom.us/j/..."
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
        </div>
        <div className="rounded-lg px-3 py-2.5 text-[12px]" style={{ background: '#EDE8FF', color: '#6146C4' }}>
          📧 <strong>Email reminders</strong> auto-send at 24h, 1h, and 10 min before via cron.
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
          style={{ background: '#7C5CDB' }}>
          {loading ? 'Scheduling…' : 'Schedule & Notify Students'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AdminLiveClient({ courses, classes, liveNow, monthlyStats }: Props) {
  const router    = useRouter()
  const [showForm,   setShowForm]   = useState(false)
  const [tabFilter,  setTabFilter]  = useState<'all'|'live'|'upcoming'|'past'>('all')
  const [toast,      setToast]      = useState('')
  const [confirm,    setConfirm]    = useState<{ msg: string; label: string; color: string; cb: () => void } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600) }

  async function patchClass(id: string, data: Record<string, unknown>) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/live-classes/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Request failed')
      }
      router.refresh()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = classes.filter(c => tabFilter === 'all' ? true : filterKey(c.status) === tabFilter)

  return (
    <div className="px-7 py-6 pb-12">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] tracking-tight" style={{ color: '#1A1523' }}>Live Class Scheduler</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#9591A8' }}>Schedule, manage, and track live sessions.</div>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1.5 px-4 font-bold text-[12px] text-white rounded-lg transition-colors hover:bg-[#6146C4]"
          style={{ height: 34, background: '#7C5CDB' }}>
          <Svg size={13}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
          Schedule Class
        </button>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-4">

          {showForm && (
            <ScheduleForm
              courses={courses}
              onClose={() => setShowForm(false)}
              onSuccess={() => { setShowForm(false); showToast('Class scheduled — students notified ✓'); router.refresh() }}
            />
          )}

          {/* Live Now Banner */}
          {liveNow && (
            <div className="rounded-xl px-6 py-5 flex items-center gap-4 flex-wrap"
              style={{ background: 'linear-gradient(135deg,#0F172A,#2D1B69)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,.2)', border: '2px solid rgba(239,68,68,.4)' }}>
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: '#EF4444', animation: 'pulse 1.2s infinite' }} />
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C]">LIVE NOW</span>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,.4)' }}>{liveNow.attendance} students joined</span>
                </div>
                <div className="text-[16px] font-bold text-white">{liveNow.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,.5)' }}>{liveNow.courseTitle}</div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {liveNow.meetingLink && (
                  <a href={liveNow.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg font-bold text-[12px] text-white text-center"
                    style={{ background: '#EF4444' }}>Open in Zoom</a>
                )}
                <button
                  onClick={() => setConfirm({ msg: `End session for all ${liveNow.attendance} students?`, label: 'End Class', color: '#EF4444',
                    cb: () => patchClass(liveNow.id, { status: 'COMPLETED' }) })}
                  className="px-4 py-2 rounded-lg font-bold text-[12px] disabled:opacity-60"
                  disabled={actionLoading === liveNow.id}
                  style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.2)' }}>
                  {actionLoading === liveNow.id ? 'Ending…' : 'End Class'}
                </button>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[15px] font-black" style={{ color: '#1A1523' }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Schedule
              </div>
              <div className="flex gap-1.5">
                <button className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#E8E8EC] text-[14px]">‹</button>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#E8E8EC] text-[14px]">›</button>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="grid grid-cols-7 mb-1.5">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} className="text-[10px] font-bold text-center py-1" style={{ color: '#9591A8' }}>{d}</div>
                ))}
              </div>
              <CalendarGrid classes={classes} />
              <div className="flex gap-4 mt-3 text-[11px]" style={{ color: '#9591A8' }}>
                {[{ color: '#7C5CDB', label: 'Scheduled' }, { color: '#EF4444', label: 'Live now' }, { color: '#22C55E', label: 'Completed' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />{l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sessions table */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[15px] font-black" style={{ color: '#1A1523' }}>All Sessions</div>
              <div className="flex gap-1 p-1 rounded-lg border border-[#E8E8EC]" style={{ background: '#F4F4F6' }}>
                {(['all','live','upcoming','past'] as const).map(t => (
                  <button key={t} onClick={() => setTabFilter(t)}
                    className="px-3 py-1 rounded-md text-[11px] font-bold transition-all capitalize"
                    style={{ background: tabFilter === t ? '#fff' : 'transparent', color: tabFilter === t ? '#7C5CDB' : '#9591A8',
                      boxShadow: tabFilter === t ? '0 1px 3px rgba(0,0,0,.07)' : 'none' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E8EC' }}>
                  {['Title','Date & Time','Course','RSVP','Attended','Recording','Status',''].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.6px] px-4 py-3" style={{ color: '#9591A8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-[13px]" style={{ color: '#9591A8' }}>No sessions.</td></tr>
                ) : filtered.map(c => {
                  const stat = statusBadge(c.status)
                  const busy = actionLoading === c.id
                  return (
                    <tr key={c.id} className="group transition-colors" style={{ borderBottom: '1px solid #E8E8EC' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#1A1523' }}>{c.title}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#9591A8' }}>{fmtDate(c.scheduledAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${coursePillCls(c.courseTitle)}`}>
                          {c.courseTitle.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#1A1523' }}>{c.attendance}</td>
                      <td className="px-4 py-3 text-[12px]">
                        {c.status === 'COMPLETED' ? <span className="font-bold" style={{ color: '#22C55E' }}>{c.attendance} attended</span>
                          : c.status === 'LIVE' ? <span className="font-bold" style={{ color: '#22C55E' }}>{c.attendance} joined</span>
                          : <span style={{ color: '#9591A8' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {c.recordingUrl
                          ? <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] hover:opacity-80">✓ Ready</a>
                          : c.status === 'LIVE' ? <span className="text-[11px]" style={{ color: '#9591A8' }}>Processing...</span>
                          : <span className="text-[11px]" style={{ color: '#9591A8' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: stat.bg, color: stat.text }}>
                          {stat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {c.status === 'SCHEDULED' && (
                            <button onClick={() => setConfirm({ msg: 'Cancel this class? Students will be notified.', label: 'Cancel', color: '#EF4444',
                                cb: () => patchClass(c.id, { status: 'CANCELLED' }) })}
                              disabled={busy}
                              className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#EF4444] hover:bg-[#FEE2E2] transition-all disabled:opacity-50">
                              <Svg size={12}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></Svg>
                            </button>
                          )}
                          {(c.status === 'COMPLETED' || c.status === 'LIVE') && (
                            <>
                              <button onClick={() => showToast('Attendance report opened')}
                                className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#7C5CDB] hover:bg-[#EDE8FF] transition-all">
                                <Svg size={12}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></Svg>
                              </button>
                              {c.recordingUrl && (
                                <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer"
                                  className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#7C5CDB] hover:bg-[#EDE8FF] transition-all">
                                  <Svg size={12}><polygon points="5 3 19 12 5 21 5 3"/></Svg>
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[15px] font-black" style={{ color: '#1A1523' }}>This Month</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { label: 'Classes held',     value: monthlyStats.classesHeld,                           color: '#1A1523' },
                { label: 'Total attendees',  value: monthlyStats.totalAttendees,                        color: '#1A1523' },
                { label: 'Avg attendance',   value: monthlyStats.avgAttendance,                         color: '#22C55E' },
                { label: 'Attendance rate',  value: `${monthlyStats.attendanceRate}%`,                  color: '#7C5CDB' },
                { label: 'Recordings ready', value: `${monthlyStats.recordingsReady} / ${monthlyStats.classesHeld}`, color: '#1A1523' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9591A8' }}>{s.label}</span>
                  <span className="text-[15px] font-semibold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
              {monthlyStats.attendanceChart.length > 0 && (
                <div className="pt-3 border-t border-[#E8E8EC]">
                  <div className="text-[12px] font-bold mb-2" style={{ color: '#1A1523' }}>Attendance per session</div>
                  <AttendanceChart data={monthlyStats.attendanceChart} />
                </div>
              )}
              <button onClick={() => showToast('Recording upload — connect Cloudflare R2 in .env')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-[12px] mt-1"
                style={{ background: '#EDE8FF', color: '#7C5CDB', border: '1.5px dashed #D4CAF7' }}>
                <Svg size={13}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>
                Upload Recording
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-white rounded-xl p-7 w-[380px] shadow-2xl" style={{ animation: 'pop .18s ease' }}>
            <style>{`@keyframes pop{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <div className="text-[18px] mb-2">⚠️</div>
            <div className="text-[15px] font-black mb-1.5" style={{ color: '#1A1523' }}>{confirm.label}?</div>
            <div className="text-[13px] mb-5" style={{ color: '#9591A8' }}>{confirm.msg}</div>
            <div className="flex gap-2.5">
              <button onClick={() => { confirm.cb(); setConfirm(null) }}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white"
                style={{ background: confirm.color }}>{confirm.label}</button>
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E8E8EC]"
                style={{ color: '#1A1523' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white z-[9999]"
          style={{ background: '#1A1730', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}