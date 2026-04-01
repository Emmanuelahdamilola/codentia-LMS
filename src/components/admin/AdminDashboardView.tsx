'use client'
// All animated UI for the Admin Dashboard.
// Receives fully-computed, JSON-serialisable props from the server page.

import { motion } from 'framer-motion'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Enrollment {
  userName:   string
  courseTitle: string
  enrolledAt:  string // ISO
}

interface Submission {
  id:              string
  status:          string
  assignmentTitle: string
  userName:        string
}

interface TopStudent {
  id:      string
  name:    string
  lessons: number
}

interface LiveClass {
  id:           string
  title:        string
  courseTitle:  string
  scheduledAt:  string // ISO
  status:       string
}

export interface AdminDashboardViewProps {
  totalStudents:        number
  activeStudents:       number
  pendingSubmissions:   number
  liveClassesThisMonth: number
  recentEnrollments:    Enrollment[]
  recentSubmissions:    Submission[]
  topStudents:          TopStudent[]
  upcomingClasses:      LiveClass[]
  avgQuiz:              number
  buckets:              { a: number; b: number; c: number; d: number }
  aiInsight:            string
  nowMs:                number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#8B5CF6','#06B6D4','#10B981','#F59E0B','#DC2626','#7C5CDB']
const avatarColor   = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const initials      = (name: string) => name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

function daysAgo(isoDate: string, nowMs: number): string {
  const diff = Math.floor((nowMs - new Date(isoDate).getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function StatCard({
  color, iconKey, delta, deltaDir, value, label, href,
}: {
  color: 'purple'|'green'|'amber'|'blue'
  iconKey: 'students'|'active'|'submissions'|'live'
  delta: string; deltaDir: 'up'|'down'|'neu'
  value: string|number; label: string; href?: string
}) {
  const topBar = { purple:'#7C5CDB', green:'#16A34A', amber:'#F59E0B', blue:'#3B82F6' }[color]
  const iconBg = {
    purple:'bg-[#EDE8FF] text-[#7C5CDB]', green:'bg-[#DCFCE7] text-[#16A34A]',
    amber:'bg-[#FEF3C7] text-[#D97706]',  blue:'bg-[#DBEAFE] text-[#3B82F6]',
  }[color]
  const deltaCls = {
    up:'bg-[#DCFCE7] text-[#16A34A]', down:'bg-[#FEE2E2] text-[#DC2626]', neu:'bg-[#F7F7F9] text-[#9591A8]',
  }[deltaDir]

  const Icon = () => {
    if (iconKey === 'students') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:17,height:17,flexShrink:0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
    if (iconKey === 'active')   return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:17,height:17,flexShrink:0 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    if (iconKey === 'submissions') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:17,height:17,flexShrink:0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:17,height:17,flexShrink:0 }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  }

  const inner = (
    <div className="bg-white rounded-2xl border border-[#E9E7EF] relative overflow-hidden"
      style={{ boxShadow:'0 2px 8px rgba(15,13,26,0.06)' }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}><Icon /></div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${deltaCls}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-semibold leading-none tracking-tight mb-1" style={{ color:'#1A1523' }}>{value}</div>
        <div className="text-[12px] font-bold" style={{ color:'#9591A8' }}>{label}</div>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block no-underline">{inner}</Link> : inner
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardView({
  totalStudents, activeStudents, pendingSubmissions, liveClassesThisMonth,
  recentEnrollments, recentSubmissions, topStudents, upcomingClasses,
  aiInsight, nowMs,
}: AdminDashboardViewProps) {
  const maxLessons = topStudents[0]?.lessons || 1

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 pb-12">

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
        className="flex gap-2 sm:gap-2.5 mb-6 flex-wrap"
      >
        {[
          { label: 'New Course',     href: '/admin/courses',       svgPath: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></> },
          { label: 'Add Lesson',     href: '/admin/lessons',       svgPath: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
          { label: 'Schedule Class', href: '/admin/live-classes',  svgPath: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
          { label: 'Announce',       href: '/admin/notifications', svgPath: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
          { label: 'Analytics',      href: '/admin/analytics',     svgPath: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
        ].map((qa, i) => (
          <motion.div key={qa.label}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as any }}
            whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(124,92,219,0.14)' }}
            whileTap={{ scale: 0.96 }}
          >
            <Link href={qa.href}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-semibold text-[12px] sm:text-[12.5px] no-underline hover:border-[#7C5CDB] hover:text-[#7C5CDB] hover:bg-[#EDE8FF]"
              style={{ border:'1px solid #E9E7EF', background:'#fff', color:'#5A5672', boxShadow:'0 1px 3px rgba(15,13,26,0.06)', transition:'color 0.12s, border-color 0.12s, background 0.12s', whiteSpace:'nowrap' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:13, height:13, flexShrink:0 }}>
                {qa.svgPath}
              </svg>
              {qa.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { color:'purple' as const, iconKey:'students'    as const, delta:'↑ 12%',   dir:'up'  as const, value:totalStudents,        label:'Total Students',         href:'/admin/students'    },
          { color:'green'  as const, iconKey:'active'      as const, delta:'↑ 8%',    dir:'up'  as const, value:activeStudents,       label:'Active (7 days)',         href:undefined            },
          { color:'amber'  as const, iconKey:'submissions' as const, delta:'Pending',  dir:'neu' as const, value:pendingSubmissions,   label:'Ungraded Submissions',    href:'/admin/assignments' },
          { color:'blue'   as const, iconKey:'live'        as const, delta:'↑ 4',     dir:'up'  as const, value:liveClassesThisMonth, label:'Live Classes This Month', href:'/admin/live-classes'},
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] as any }}
          >
            <StatCard color={s.color} iconKey={s.iconKey} delta={s.delta} deltaDir={s.dir}
              value={s.value} label={s.label} href={s.href} />
          </motion.div>
        ))}
      </div>

      {/* AI Insight */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex items-start gap-3 px-4 sm:px-5 py-4 rounded-2xl mb-6"
        style={{ background:'#EDE8FF', border:'1px solid #C8C1E8' }}
      >
        <span className="text-[18px] shrink-0">🤖</span>
        <div className="text-[13px] leading-relaxed" style={{ color:'#4C3999' }}>
          <strong>AI Insights: </strong>{aiInsight}
        </div>
      </motion.div>

      {/* Middle row: Enrollments / Submissions / Top Students */}
      <div className="grid gap-4 sm:gap-5 mb-5 grid-cols-1 lg:grid-cols-3">

        {/* Recent Enrollments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #E9E7EF', boxShadow:'0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-4" style={{ borderBottom:'1px solid #E9E7EF' }}>
            <div className="text-[14px] sm:text-[14.5px] font-semibold text-[#1A1523]">Recent Enrollments</div>
            <Link href="/admin/students" className="text-[12px] font-semibold no-underline" style={{ color:'#7C5CDB' }}>View all →</Link>
          </div>
          <div>
            {recentEnrollments.slice(0, 5).map((e, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#FAF8FF]"
                style={{ borderBottom: i < 4 ? '1px solid #F0EEF7' : 'none', transition:'background 0.12s', cursor:'default' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: avatarColor(e.userName) }}>{initials(e.userName)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1A1523] truncate">{e.userName}</div>
                  <div className="text-[11.5px] text-[#9591A8] truncate">{e.courseTitle}</div>
                </div>
                <div className="text-[11px] shrink-0" style={{ color:'#C4C0D4' }}>{daysAgo(e.enrolledAt, nowMs)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pending Submissions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.4 }}
          className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #E9E7EF', boxShadow:'0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-4" style={{ borderBottom:'1px solid #E9E7EF' }}>
            <div className="text-[14px] sm:text-[14.5px] font-semibold text-[#1A1523]">Pending Submissions</div>
            <Link href="/admin/assignments" className="text-[12px] font-semibold no-underline" style={{ color:'#7C5CDB' }}>Review →</Link>
          </div>
          <div>
            {recentSubmissions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="text-[13px] font-semibold text-[#1A1523] mb-1">All clear! 🎉</div>
                <div className="text-[12px] text-[#9591A8]">No pending submissions</div>
              </div>
            ) : recentSubmissions.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#FAF8FF]"
                style={{ borderBottom: i < recentSubmissions.length - 1 ? '1px solid #F0EEF7' : 'none', transition:'background 0.12s', cursor:'default' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background:'#FEF3C7' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1A1523] truncate">{s.assignmentTitle}</div>
                  <div className="text-[11.5px] text-[#9591A8] truncate">{s.userName}</div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: s.status === 'AI_REVIEWED' ? '#EDE8FF' : '#FEF3C7', color: s.status === 'AI_REVIEWED' ? '#6146C4' : '#B45309' }}>
                  {s.status === 'AI_REVIEWED' ? 'AI done' : 'Pending'}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Students */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.49, duration: 0.4 }}
          className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #E9E7EF', boxShadow:'0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="px-4 sm:px-5 py-4" style={{ borderBottom:'1px solid #E9E7EF' }}>
            <div className="text-[14px] sm:text-[14.5px] font-semibold text-[#1A1523]">Top Students</div>
          </div>
          <div className="px-4 sm:px-5 py-3 flex flex-col gap-3">
            {topStudents.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.52 + i * 0.06 }}
                className="flex items-center gap-2.5"
              >
                <span className="text-[11px] font-bold w-4 text-center shrink-0" style={{ color: i === 0 ? '#D97706' : '#C4C0D4' }}>#{i+1}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: avatarColor(s.name) }}>{initials(s.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#1A1523] truncate">{s.name}</div>
                  <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background:'#E9E7EF' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.lessons / maxLessons) * 100}%` }}
                      transition={{ delay: 0.6 + i * 0.06, duration: 0.6, ease: [0.25, 1, 0.5, 1] as any }}
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? '#7C5CDB' : '#C8C1E8' }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color:'#9591A8' }}>{s.lessons}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Live Classes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border:'1px solid #E9E7EF', boxShadow:'0 2px 8px rgba(15,13,26,0.06)' }}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-4" style={{ borderBottom:'1px solid #E9E7EF' }}>
          <div className="text-[14px] sm:text-[14.5px] font-semibold text-[#1A1523]">Upcoming Live Classes</div>
          <Link href="/admin/live-classes" className="text-[12px] font-semibold no-underline" style={{ color:'#7C5CDB' }}>Manage →</Link>
        </div>
        {upcomingClasses.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="text-[13px] font-semibold text-[#1A1523] mb-1">No upcoming classes</div>
            <Link href="/admin/live-classes" className="text-[12.5px] font-semibold no-underline" style={{ color:'#7C5CDB' }}>Schedule one →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background:'#E9E7EF' }}>
            {upcomingClasses.map((cls, i) => (
              <motion.div key={cls.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className="bg-white p-4 sm:p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:'#EDE8FF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C5CDB" strokeWidth="2" strokeLinecap="round">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                  </div>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background:'#EDE8FF', color:'#7C5CDB' }}>
                    {cls.status === 'LIVE' ? '🔴 Live' : 'Scheduled'}
                  </span>
                </div>
                <div className="text-[13px] sm:text-[13.5px] font-semibold text-[#1A1523] mb-1">{cls.title}</div>
                <div className="text-[12px] text-[#9591A8]">{cls.courseTitle}</div>
                <div className="text-[11.5px] font-medium mt-2" style={{ color:'#7C5CDB' }}>
                  {new Date(cls.scheduledAt).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
                  {' · '}
                  {new Date(cls.scheduledAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}