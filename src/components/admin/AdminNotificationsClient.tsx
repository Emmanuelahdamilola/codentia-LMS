// PATH: src/components/admin/AdminNotificationsClient.tsx
'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Notif {
  id: string; type: string; title: string; message: string
  read: boolean; link: string | null; createdAt: string
  userName: string; userEmail: string
}
interface Props { notifications: Notif[]; unreadCount: number }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function typeColor(type: string) {
  if (type === 'QUIZ_RESULT')         return '#7C5CDB'
  if (type === 'ASSIGNMENT_FEEDBACK') return '#F59E0B'
  if (type === 'LIVE_CLASS_REMINDER') return '#3B82F6'
  if (type === 'NEW_LESSON')          return '#22C55E'
  if (type === 'ASSIGNMENT_DEADLINE') return '#EF4444'
  return '#9591A8'
}

function typeIcon(type: string): string {
  if (type === 'QUIZ_RESULT')         return '🎯'
  if (type === 'ASSIGNMENT_FEEDBACK') return '📝'
  if (type === 'LIVE_CLASS_REMINDER') return '📹'
  if (type === 'NEW_LESSON')          return '📚'
  if (type === 'ASSIGNMENT_DEADLINE') return '⏰'
  return '🔔'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'Yesterday'
  return `${d} days ago`
}

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{ width: 38, height: 22, background: checked ? '#7C5CDB' : '#E8E8EC' }}>
      <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ left: 3, transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  )
}

// Notification history items (static — represent system-level sent emails)
const HISTORY = [
  { color: '#7C5CDB', text: 'Announcement — "New React course module added" sent to all 248 students',   time: '2h' },
  { color: '#F59E0B', text: 'Reminder — Live class reminder sent to 31 students (JS Fund.)',              time: '4h' },
  { color: '#EF4444', text: 'At-risk alert — AI study recommendations sent to 27 students',               time: '6h' },
  { color: '#22C55E', text: 'Course update — "Assignment deadline extended" sent to 112 JS students',     time: 'Yesterday' },
  { color: '#3B82F6', text: 'Re-engagement — "We miss you!" sent to 14 inactive students',                time: '2 days ago' },
  { color: '#7C5CDB', text: 'Announcement — "Welcome to Codentia! Here\'s how to get started" sent to 8 new students', time: '3 days ago' },
]

// Email stats
const EMAIL_STATS = [
  { label: 'Emails sent',       value: '847', pct: 100, color: '#7C5CDB' },
  { label: 'Open rate',         value: '68%', pct: 68,  color: '#22C55E' },
  { label: 'Click-through rate',value: '34%', pct: 34,  color: '#7C5CDB' },
  { label: 'Unsubscribes',      value: '3',   pct: 2,   color: '#EF4444' },
]

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function AdminNotificationsClient({ notifications, unreadCount }: Props) {
  // Compose form state
  const [target,     setTarget]     = useState('all')
  const [notifType,  setNotifType]  = useState('📢 Announcement')
  const [subject,    setSubject]    = useState('')
  const [message,    setMessage]    = useState('')
  const [schedLater, setSchedLater] = useState(false)
  const [inApp,      setInApp]      = useState(true)
  const [byEmail,    setByEmail]    = useState(true)

  // Automation toggles
  const [auto, setAuto] = useState({
    liveReminders:    true,
    deadlineReminders:true,
    aiRecommendations:true,
    reEngagement:     true,
    newCourse:        true,
  })

  // Notification list filter
  const [tabFilter, setTabFilter] = useState<'all'|'unread'>('all')
  const [toast,     setToast]     = useState('')
  const [confirm,   setConfirm]   = useState<{ msg: string; label: string; cb: () => void } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const filtered = notifications.filter(n => tabFilter === 'unread' ? !n.read : true)

  const TARGETS = [
    { key: 'all',    label: 'All Students (248)' },
    { key: 'html',   label: 'HTML & CSS (84)' },
    { key: 'js',     label: 'JavaScript (112)' },
    { key: 'react',  label: 'React.js (52)' },
    { key: 'atrisk', label: 'At-Risk Students (27)' },
  ]

  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!subject.trim() || !message.trim()) { showToast('Please fill in subject and message'); return }
    setSending(true)
    try {
      const res = await fetch('/api/admin/notifications/announce', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ target, subject, message, type: notifType, sendEmail: byEmail, sendInApp: inApp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      showToast(`Sent to ${data.totalUsers} students (${data.inAppSent} in-app, ${data.emailSent} email) ✓`)
      setSubject(''); setMessage('')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
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

  return (
    <div className="px-7 py-6 pb-12">

      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em] tracking-tight" style={{ color: '#1A1523' }}>Notifications & Email</h1>
        <div className="text-[13px] mt-0.5" style={{ color: '#9591A8' }}>
          Send announcements, schedule emails, and manage communication.
        </div>
      </div>

      {/* ── 2-col grid: left compose, right history ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-4">

          {/* Send Announcement card */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[14px] font-black flex items-center gap-2" style={{ color: '#1A1523' }}>
                <span className="text-[18px]">📢</span> Send Announcement
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">

              {/* Target audience */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-2" style={{ color: '#9591A8' }}>
                  Target Audience
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TARGETS.map(t => (
                    <button key={t.key} onClick={() => setTarget(t.key)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all"
                      style={{
                        background:  target === t.key ? '#7C5CDB' : '#fff',
                        color:       target === t.key ? '#fff'    : '#9591A8',
                        borderColor: target === t.key ? '#7C5CDB' : '#E8E8EC',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification type */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>
                  Notification Type
                </label>
                <select value={notifType} onChange={e => setNotifType(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
                  style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }}>
                  <option>📢 Announcement</option>
                  <option>🔔 Reminder</option>
                  <option>📚 Course Update</option>
                  <option>🎉 Achievement</option>
                  <option>⚠️ Warning</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>
                  Subject Line
                </label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. New Live Class Scheduled for Thursday!"
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>
                  Message
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Write your announcement here..."
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-y"
                  style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523', minHeight: 120 }} />
              </div>

              {/* Schedule toggle */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: '#F4F4F6' }}>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: '#1A1523' }}>Schedule for later</div>
                  <div className="text-[11px]" style={{ color: '#9591A8' }}>Set a specific send date & time</div>
                </div>
                <Toggle id="sched" checked={schedLater} onChange={setSchedLater} />
              </div>
              {schedLater && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Date</label>
                    <input type="date" className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                      style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#9591A8' }}>Time</label>
                    <input type="time" defaultValue="09:00" className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                      style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#1A1523' }} />
                  </div>
                </div>
              )}

              {/* Channels */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-2" style={{ color: '#9591A8' }}>
                  Send via
                </label>
                <div className="flex gap-5 flex-wrap">
                  <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                    <input type="checkbox" checked={inApp} onChange={e => setInApp(e.target.checked)}
                      style={{ accentColor: '#7C5CDB' }} />
                    In-app notification
                  </label>
                  <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                    <input type="checkbox" checked={byEmail} onChange={e => setByEmail(e.target.checked)}
                      style={{ accentColor: '#7C5CDB' }} />
                    Email
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button onClick={handleSend} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
                  style={{ background: '#7C5CDB' }}>
                  <Svg size={13}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
                  {sending ? 'Sending…' : 'Send Now'}
                </button>
                <button onClick={() => showToast('Saved as draft')}
                  className="flex-1 py-3 rounded-lg font-bold text-[13px] border border-[#E8E8EC] transition-colors"
                  style={{ background: '#F4F4F6', color: '#1A1523' }}>
                  Save Draft
                </button>
              </div>
            </div>
          </div>

          {/* Notification list */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[15px] font-black" style={{ color: '#1A1523' }}>
                Student Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C]">{unreadCount} unread</span>
                )}
              </div>
              <div className="flex gap-1 p-1 rounded-lg border border-[#E8E8EC]" style={{ background: '#F4F4F6' }}>
                {(['all','unread'] as const).map(t => (
                  <button key={t} onClick={() => setTabFilter(t)}
                    className="px-3 py-1 rounded-md text-[11px] font-bold transition-all capitalize"
                    style={{
                      background: tabFilter === t ? '#fff' : 'transparent',
                      color:      tabFilter === t ? '#7C5CDB' : '#9591A8',
                      boxShadow:  tabFilter === t ? '0 1px 3px rgba(0,0,0,.07)' : 'none',
                    }}>
                    {t === 'all' ? 'All' : 'Unread'}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-[#E8E8EC]" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-[13px]" style={{ color: '#9591A8' }}>No notifications.</div>
              ) : filtered.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                  {/* Type icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[16px]"
                    style={{ background: typeColor(n.type) + '20' }}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-bold truncate" style={{ color: '#1A1523' }}>{n.title}</div>
                      {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />}
                    </div>
                    <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: '#9591A8' }}>{n.message}</div>
                    <div className="text-[11px] mt-1" style={{ color: '#BCBBBB' }}>
                      {n.userName} · {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {n.link && (
                    <a href={n.link} className="text-[11px] font-bold flex-shrink-0 hover:underline" style={{ color: '#7C5CDB' }}>
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email Automation */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[14px] font-black flex items-center gap-2" style={{ color: '#1A1523' }}>
                <span className="text-[18px]">🤖</span> Email Automation
              </div>
            </div>
            <div className="px-4 divide-y divide-[#E8E8EC]">
              {[
                { key: 'liveReminders',     label: 'Live class reminders (24h, 1h, 10min)',  sub: 'Auto-sent to enrolled students' },
                { key: 'deadlineReminders', label: 'Assignment deadline reminders',           sub: '24h before due date' },
                { key: 'aiRecommendations', label: 'AI study recommendations',                sub: 'Triggered when quiz score < 60%' },
                { key: 'reEngagement',      label: 'Re-engagement for inactive students',      sub: 'After 7 days of inactivity' },
                { key: 'newCourse',         label: 'New course published',                    sub: 'Notify all students' },
              ].map((row, i, arr) => (
                <div key={row.key} className="flex items-center justify-between py-3"
                  style={{ borderBottom: i === arr.length - 1 ? 'none' : undefined }}>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: '#1A1523' }}>{row.label}</div>
                    <div className="text-[11px]" style={{ color: '#9591A8' }}>{row.sub}</div>
                  </div>
                  <Toggle
                    id={row.key}
                    checked={auto[row.key as keyof typeof auto]}
                    onChange={v => setAuto(a => ({ ...a, [row.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="flex flex-col gap-4">

          {/* Notification history */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[15px] font-black" style={{ color: '#1A1523' }}>Notification History</div>
              <span className="text-[11px]" style={{ color: '#9591A8' }}>Last 7 days</span>
            </div>
            <div className="px-3.5 py-1" style={{ maxHeight: 320, overflowY: 'auto' }}>
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 py-3 border-b border-[#E8E8EC] last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: h.color }} />
                  <div className="flex-1 text-[12px] leading-relaxed" style={{ color: '#1A1523' }}
                    dangerouslySetInnerHTML={{ __html: h.text.replace(/^(\w[^—]*)—/, '<strong>$1</strong>—') }} />
                  <div className="text-[11px] flex-shrink-0 whitespace-nowrap" style={{ color: '#9591A8' }}>{h.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Email stats */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E8E8EC]">
              <div className="text-[15px] font-black" style={{ color: '#1A1523' }}>Email Stats (7 days)</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {EMAIL_STATS.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: '#9591A8' }}>{s.label}</span>
                    <span className="font-bold" style={{ color: s.label === 'Unsubscribes' ? '#EF4444' : s.label === 'Open rate' ? '#22C55E' : '#1A1523' }}>
                      {s.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F6' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm dialog ── */}
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
                style={{ background: '#EF4444' }}>{confirm.label}</button>
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E8E8EC]"
                style={{ color: '#1A1523' }}>Cancel</button>
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