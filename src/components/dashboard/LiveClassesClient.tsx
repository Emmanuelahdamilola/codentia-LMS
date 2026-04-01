// PATH: src/components/dashboard/LiveClassesClient.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface LiveClass {
  id:           string
  title:        string
  description:  string | null
  instructor:   string
  meetingLink:  string
  scheduledAt:  string   // ISO string — serialised from server
  durationMins: number
  status:       string
  recordingUrl: string | null
  course:       { id: string; title: string }
}

interface Props {
  bannerClass:   LiveClass | null
  isBannerLive:  boolean
  upcoming:      LiveClass[]
  completed:     LiveClass[]
  attendedIds:   string[]
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getCourseThumb(title: string) {
  const t = title.toLowerCase()
  if (t.includes('javascript') || t.includes('js') || t.includes('closure') || t.includes('async') || t.includes('scope') || t.includes('function') || t.includes('array') || t.includes('object') || t.includes('oop'))
    return { bg: 'linear-gradient(135deg,#F0DB4F 0%,#E8C41A 100%)', icon: '⚡' }
  if (t.includes('react') || t.includes('hook') || t.includes('component'))
    return { bg: 'linear-gradient(135deg,#61DAFB 0%,#21A1C4 100%)', icon: '⚛️' }
  if (t.includes('html') || t.includes('semantic') || t.includes('accessibility'))
    return { bg: 'linear-gradient(135deg,#FF6B35 0%,#F7931E 100%)', icon: '🌐' }
  if (t.includes('css') || t.includes('flexbox') || t.includes('grid') || t.includes('layout') || t.includes('variable'))
    return { bg: 'linear-gradient(135deg,#264de4 0%,#1e3fbf 100%)', icon: '🎨' }
  return { bg: 'linear-gradient(135deg,#7C5CDB 0%,#6146C4 100%)', icon: '📺' }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    day:   d.toLocaleDateString('en-US', { weekday: 'short' }),
    num:   d.getDate(),
    full:  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time:  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

function isTomorrow(iso: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return new Date(iso).toDateString() === tomorrow.toDateString()
}

function minsUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

function formatDuration(mins: number) {
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim() : `${mins}m`
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'recordings'

export default function LiveClassesClient({ bannerClass, isBannerLive, upcoming, completed, attendedIds }: Props) {
  const [tab,           setTab]          = useState<Tab>('upcoming')
  const [reminders,     setReminders]    = useState<Set<string>>(new Set())
  const [modalClass,    setModalClass]   = useState<LiveClass | null>(null)
  const [attendJoining, setAttendJoining]= useState<string | null>(null)

  const attendedSet = new Set(attendedIds)

  function toggleReminder(id: string) {
    setReminders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Records attendance then opens the meeting link
  async function handleJoin(id: string, meetingLink: string) {
    setAttendJoining(id)
    try {
      await fetch('/api/live-classes/attend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ liveClassId: id }),
      })
    } catch {
      // Non-fatal — still open the link even if attendance recording fails
    } finally {
      setAttendJoining(null)
    }
    window.open(meetingLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }} className="p-4 md:p-7">
      {/* Page title */}
      <h1 className="text-[26px] font-semibold text-[#1A1523] mb-1 animate-fade-up" style={{ letterSpacing: "-0.03em" }}>Live Classes</h1>
      <p className="text-[13.5px] text-[#9591A8] mb-6 animate-fade-up" style={{ animationDelay: "40ms" }}>Join live sessions, review recordings, and stay on schedule.</p>

      {/* ── Live Now / Next Banner ── */}
      {bannerClass && (
        <div
          className="rounded-2xl px-7 py-6 flex items-center justify-between mb-7 relative overflow-hidden animate-fade-up"
          style={{ 
            animationDelay: "80ms",
            background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' 
          }}
        >
          <span className="absolute -right-16 -top-16 w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'rgba(138,112,214,.15)' }} />
          <span className="absolute right-20 -bottom-20 w-[160px] h-[160px] rounded-full pointer-events-none" style={{ background: 'rgba(97,218,251,.08)' }} />

          <div className="relative z-10">
            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-2.5">
              {isBannerLive ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" style={{ animation: 'pulse 1.5s infinite' }} />
                  <span className="text-[11px] font-bold tracking-[1.5px] text-[#DC2626] uppercase">Live Now</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CDB]" />
                  <span className="text-[11px] font-bold tracking-[1.5px] text-[#7C5CDB] uppercase">
                    {isToday(bannerClass.scheduledAt) ? 'Today' : isTomorrow(bannerClass.scheduledAt) ? 'Tomorrow' : 'Upcoming'}
                  </span>
                </>
              )}
            </div>

            <h2 className="text-[20px] font-semibold text-white mb-1.5" style={{ letterSpacing: "-0.02em" }}>{bannerClass.title}</h2>
            <div className="flex items-center gap-4 text-[13px] text-white/70 flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {bannerClass.instructor}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {isBannerLive
                  ? `Started ${Math.max(0, -minsUntil(bannerClass.scheduledAt))} mins ago`
                  : `${formatDate(bannerClass.scheduledAt).full} at ${formatDate(bannerClass.scheduledAt).time}`
                }
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                {formatDuration(bannerClass.durationMins)}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-end gap-3">
            <button
              onClick={() => handleJoin(bannerClass.id, bannerClass.meetingLink)}
              disabled={attendJoining === bannerClass.id}
              className="flex items-center gap-2 text-white font-bold text-[14px] px-7 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
              style={{ background: '#7C5CDB' }}
              onMouseEnter={e => { if (attendJoining !== bannerClass.id) e.currentTarget.style.background = '#6146C4' }}
              onMouseLeave={e => (e.currentTarget.style.background = '#7C5CDB')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              {attendJoining === bannerClass.id ? 'Joining…' : isBannerLive ? 'Join Now' : 'Join Class'}
            </button>
            {isBannerLive && (
              <span className="flex items-center gap-1.5 text-[12px] text-white/60">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                24 live viewers
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-0 bg-white border border-[#E9E7EF] rounded-xl overflow-hidden mb-5 w-fit">
        {(['upcoming', 'recordings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-[13px] font-bold border-none transition-all duration-150 capitalize ${
              tab === t ? 'bg-[#7C5CDB] text-white' : 'text-[#9591A8] hover:bg-[#EDE8FF] hover:text-[#7C5CDB]'
            }`}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Recordings'}
          </button>
        ))}
      </div>

      {/* ── Upcoming Panel ── */}
      {tab === 'upcoming' && (
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <div className="bg-white border border-[#E9E7EF] rounded-2xl p-16 text-center">
              <p className="text-[13px] text-[#9591A8]">No upcoming classes scheduled.</p>
            </div>
          ) : (
            upcoming.map(cls => {
              const { day, num, full, time } = formatDate(cls.scheduledAt)
              const soon    = minsUntil(cls.scheduledAt) <= 60 && minsUntil(cls.scheduledAt) > 0
              const today   = isToday(cls.scheduledAt)
              const tmrw    = isTomorrow(cls.scheduledAt)
              const hasRem  = reminders.has(cls.id)
              const thumb   = getCourseThumb(cls.title)

              return (
                <div
                  key={cls.id}
                  className={`bg-white border rounded-2xl px-5 py-4 flex items-center gap-5 shadow-[0_2px_8px_rgba(15,13,26,0.06)] transition-all duration-200 hover:shadow-[0_4px_24px_rgba(138,112,214,.12)] ${
                    today || soon ? 'border-[#D4CAF7] bg-gradient-to-r from-[#faf8ff] to-white' : 'border-[#E9E7EF]'
                  }`}
                >
                  {/* Date column */}
                  <div className="text-center min-w-[52px] flex-shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#9591A8]">{day}</div>
                    <div className={`text-[26px] font-semibold leading-none ${today || soon ? 'text-[#7C5CDB]' : 'text-[#1A1523]'}`}>{num}</div>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-14 bg-[#E9E7EF] flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-[#1A1523] mb-1.5 truncate">{cls.title}</h3>
                    <div className="flex items-center gap-3.5 text-[12px] text-[#9591A8] flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {today ? `Today at ${time}` : tmrw ? `Tomorrow at ${time}` : `${full} at ${time}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        {cls.instructor}
                      </span>
                      <span>{formatDuration(cls.durationMins)}</span>
                    </div>
                    {/* Tags */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {tmrw && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706]">Tomorrow</span>}
                      {today && !soon && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FF] text-[#7C5CDB]">Today</span>}
                      {soon && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7C5CDB] text-white">Starting in {minsUntil(cls.scheduledAt)}m</span>}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getCourseTag(cls.course.title)}`}>
                        {cls.course.title.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <button
                      onClick={() => toggleReminder(cls.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border-[1.5px] text-[12px] font-bold transition-all duration-150 ${
                        hasRem
                          ? 'border-[#7C5CDB] bg-[#EDE8FF] text-[#7C5CDB]'
                          : 'border-[#E9E7EF] text-[#9591A8] hover:border-[#7C5CDB] hover:text-[#7C5CDB]'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      {hasRem ? 'Reminder On' : 'Set Reminder'}
                    </button>
                    {(today || soon) && (
                      <button
                        onClick={() => handleJoin(cls.id, cls.meetingLink)}
                        disabled={attendJoining === cls.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-bold text-white transition-all duration-150 disabled:opacity-70 disabled:cursor-wait"
                        style={{ background: soon ? '#7C5CDB' : '#6146C4' }}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        {attendJoining === cls.id ? 'Joining…' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Recordings Panel ── */}
      {tab === 'recordings' && (
        <div>
          {completed.length === 0 ? (
            <div className="bg-white border border-[#E9E7EF] rounded-2xl p-16 text-center">
              <p className="text-[13px] text-[#9591A8]">No recordings available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(cls => {
                const thumb   = getCourseThumb(cls.title)
                const watched = attendedSet.has(cls.id)
                const { short } = formatDate(cls.scheduledAt)

                return (
                  <div
                    key={cls.id}
                    onClick={() => cls.recordingUrl ? setModalClass(cls) : null}
                    className={`bg-white border border-[#E9E7EF] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(15,13,26,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(138,112,214,.12)] hover:border-[#D4CAF7] ${cls.recordingUrl ? 'cursor-pointer' : 'opacity-60'}`}
                  >
                    {/* Thumbnail */}
                    <div className="h-[140px] relative flex items-center justify-center" style={{ background: thumb.bg }}>
                      <span className="text-[40px]" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.2))' }}>{thumb.icon}</span>

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center">
                          <svg className="w-[18px] h-[18px] ml-0.5" viewBox="0 0 24 24" fill="#7C5CDB">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-2 right-2.5 bg-black/65 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                        {formatDuration(cls.durationMins)}
                      </div>

                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/20">
                        <div className="h-full bg-white/80" style={{ width: watched ? '100%' : '0%' }} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3.5">
                      <h3 className="text-[13px] font-bold text-[#1A1523] mb-1.5 leading-snug line-clamp-2">{cls.title}</h3>
                      <div className="flex items-center justify-between text-[11px] text-[#9591A8]">
                        <span className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {short}
                        </span>
                      </div>
                      {watched && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A] mt-1.5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          Watched
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Recording Modal ── */}
      {modalClass && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={() => setModalClass(null)}
        >
          <div
            className="bg-black rounded-2xl overflow-hidden w-full max-w-[800px] relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalClass(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Video area */}
            <div className="aspect-video flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
              {modalClass.recordingUrl ? (
                <iframe
                  src={modalClass.recordingUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#7C5CDB]/30 flex items-center justify-center">
                    <svg className="w-7 h-7 ml-1" viewBox="0 0 24 24" fill="#7C5CDB">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                  <p className="text-white/60 text-[13px]">{modalClass.title}</p>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 bg-[#111] flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-white">{modalClass.title}</div>
                <div className="text-[12px] text-white/50 mt-0.5">
                  {formatDuration(modalClass.durationMins)} · {modalClass.course.title}
                </div>
              </div>
              {modalClass.recordingUrl && (
                <button
                  onClick={() => handleJoin(modalClass.id, modalClass.recordingUrl!)}
                  className="text-[12px] font-bold text-[#7C5CDB] hover:underline">
                  Open in new tab →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Tag colour helper
function getCourseTag(title: string) {
  const t = title.toLowerCase()
  if (t.includes('javascript') || t.includes('js')) return 'bg-[#FFFBEB] text-[#D97706]'
  if (t.includes('react'))                           return 'bg-[#ECFEFF] text-[#0891B2]'
  if (t.includes('html') || t.includes('css'))      return 'bg-[#FFF7ED] text-[#EA580C]'
  return 'bg-[#EDE8FF] text-[#7C5CDB]'
}