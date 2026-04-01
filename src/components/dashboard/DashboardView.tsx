'use client'
// All animated/interactive UI for the dashboard.
// Receives fully-computed props from the server page — no DB calls here.

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Difficulty } from '@prisma/client'
import AIQuickInput from '@/components/dashboard/AIQuickInput'
import { formatDate, formatTime, isToday, isSameDay } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Types (mirrors what the server page computes)
// ─────────────────────────────────────────────────────────────

interface StatItem {
  iconKey:     'lessons' | 'quizzes' | 'assignments' | 'live'
  colorClass:  string
  value:       number
  label:       string
  change:      string
  changeColor: string
}

interface UpcomingClass {
  id:           string
  title:        string
  instructor:   string | null
  meetingLink:  string
  scheduledAt:  string   // serialised Date (ISO string)
  durationMins: number | null
  status:       string
  course:       { title: string }
}

interface EnrolledCourse {
  id:         string
  title:      string
  difficulty: Difficulty
  modules: {
    id:     string
    title:  string
    order:  number
    lessons: { id: string; order: number }[]
  }[]
}

interface ExploreCourse {
  id:         string
  title:      string
  difficulty: Difficulty
  modules:    { _count: { lessons: number } }[]
}

interface UpcomingAssignment {
  id:      string
  title:   string
  dueDate: string | null
  lesson: { module: { course: { title: string } } }
}

interface ProgressItem {
  courseId:          string
  courseTitle:       string
  percentage:        number
  completedLessons:  number
  totalLessons:      number
}

export interface DashboardViewProps {
  firstName:            string
  streak:               number
  weekProgress:         number
  welcomeSub:           string
  continueHref:         string
  stats:                StatItem[]
  exploreCourses:       ExploreCourse[]
  enrolledCourseIds:    string[]
  enrolledRows:         { enrolledAt: string; course: EnrolledCourse }[]
  progressList:         ProgressItem[]
  upcomingClasses:      UpcomingClass[]
  upcomingAssignments:  UpcomingAssignment[]
  classDates:           string[]    // ISO strings
  assignmentDates:      string[]    // ISO strings
  nowMs:                number      // Date.now() from server
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getCourseThumb(title: string): { bg: string; icon: string } {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css'))
    return { bg: 'linear-gradient(135deg,#FF6B35 0%,#F7931E 100%)', icon: '🌐' }
  if (t.includes('javascript') || t.includes('js'))
    return { bg: 'linear-gradient(135deg,#F0DB4F 0%,#E8C41A 100%)', icon: '⚡' }
  if (t.includes('react'))
    return { bg: 'linear-gradient(135deg,#61DAFB 0%,#21A1C4 100%)', icon: '⚛️' }
  if (t.includes('python'))
    return { bg: 'linear-gradient(135deg,#3572A5 0%,#2B5F8A 100%)', icon: '🐍' }
  if (t.includes('node'))
    return { bg: 'linear-gradient(135deg,#68A063 0%,#3D7A3A 100%)', icon: '🟢' }
  if (t.includes('typescript') || t.includes('ts'))
    return { bg: 'linear-gradient(135deg,#3178C6 0%,#235A97 100%)', icon: '🔷' }
  return { bg: 'linear-gradient(135deg,#7C5CDB 0%,#6146C4 100%)', icon: '📚' }
}

function totalLessonsInCourse(modules: { _count: { lessons: number } }[]) {
  return modules.reduce((s, m) => s + m._count.lessons, 0)
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Beginner',     cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    INTERMEDIATE: { label: 'Intermediate', cls: 'bg-[#FEF3C7] text-[#D97706]' },
    ADVANCED:     { label: 'Advanced',     cls: 'bg-[#FEE2E2] text-[#DC2626]' },
  }
  const { label, cls } = map[difficulty]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{label}</span>
  )
}

// Stat icon lookup — keeps icons out of serialised props
function StatIcon({ k }: { k: StatItem['iconKey'] }) {
  if (k === 'lessons') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
  if (k === 'quizzes') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
  if (k === 'assignments') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  )
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Mini Calendar (client — receives pre-computed date strings)
// ─────────────────────────────────────────────────────────────

function MiniCalendar({ classDates, assignmentDates }: { classDates: string[]; assignmentDates: string[] }) {
  const today      = new Date()
  const year       = today.getFullYear()
  const month      = today.getMonth()
  let firstDay     = new Date(year, month, 1).getDay()
  firstDay         = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const classSet   = new Set(classDates.map(d => new Date(d).getDate()))
  const assignSet  = new Set(assignmentDates.map(d => new Date(d).getDate()))
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-[#1A1523]">{monthLabel}</span>
        <div className="flex gap-1">
          {(['prev', 'next'] as const).map(dir => (
            <button key={dir} aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
              className="w-6 h-6 flex items-center justify-center rounded text-[#9591A8] hover:bg-[#EDE8FF] hover:text-[#7C5CDB] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {dir === 'prev' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px text-center mb-0.5">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-[#C4C0D4] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px text-center">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const isCurrentDay  = d === today.getDate()
          const hasClass      = classSet.has(d)
          const hasAssignment = assignSet.has(d)
          return (
            <div key={i}
              className={`relative flex items-center justify-center h-7 rounded-full text-[11px] transition-all duration-150 cursor-pointer
                ${isCurrentDay
                  ? 'bg-[#7C5CDB] text-white font-bold'
                  : (hasClass || hasAssignment)
                    ? 'text-[#1A1523] font-bold'
                    : 'text-[#9591A8] hover:bg-[#EDE8FF] hover:text-[#7C5CDB]'
                }`}>
              {d}
              {!isCurrentDay && (hasClass || hasAssignment) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: hasClass ? '#7C5CDB' : '#F59E0B' }} />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7C5CDB] inline-block flex-shrink-0" />
          <span className="text-[11px] text-[#9591A8]">Live class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block flex-shrink-0" />
          <span className="text-[11px] text-[#9591A8]">Assignment due</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main exported client component
// ─────────────────────────────────────────────────────────────

export default function DashboardView({
  firstName, streak, weekProgress, welcomeSub, continueHref,
  stats, exploreCourses, enrolledCourseIds: enrolledCourseIdArr,
  enrolledRows, progressList, upcomingClasses, upcomingAssignments,
  classDates, assignmentDates, nowMs,
}: DashboardViewProps) {
  const now              = new Date(nowMs)
  const enrolledCourseIds = new Set(enrolledCourseIdArr)

  return (
    <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - var(--topbar-height))' }}>

      {/* ══ Main ════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 p-6 space-y-6">

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl p-7 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#7C5CDB 0%,#4F38A8 100%)' }}
        >
          <span className="absolute -right-10 -top-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="absolute right-20 -bottom-14 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            <h2 className="text-[22px] font-bold text-white relative z-10" style={{ letterSpacing: '-0.03em' }}>
              Welcome back, {firstName} 👋
            </h2>
            <p className="text-[13.5px] mt-1 max-w-md relative z-10" style={{ color: 'rgba(255,255,255,0.72)' }}>{welcomeSub}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap relative z-10">
              {streak > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26, delay: 0.3 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  🔥 {streak}-day streak
                </motion.span>
              )}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26, delay: 0.38 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                ⚡ {weekProgress} lessons this week
              </motion.span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28, delay: 0.2 }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="absolute right-7 top-1/2 -translate-y-1/2 z-10"
          >
            <Link href={continueHref}
              className="flex items-center gap-2 font-semibold text-[13px] px-5 py-2.5 rounded-xl whitespace-nowrap no-underline"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', backdropFilter: 'blur(8px)' }}>
              Continue Learning →
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(({ iconKey, colorClass, value, label, change, changeColor }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(124,92,219,0.14)', borderColor: '#C8C1E8' }}
              className="bg-white rounded-2xl p-5 border border-[#E9E7EF] relative overflow-hidden cursor-default"
              style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)', transition: 'border-color 0.2s' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#7C5CDB,transparent)' }} />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
                <StatIcon k={iconKey} />
              </div>
              <div className="text-[28px] font-bold text-[#1A1523] leading-none" style={{ letterSpacing: '-0.03em' }}>{value}</div>
              <div className="text-[12.5px] text-[#9591A8] font-medium mt-1">{label}</div>
              <div className="text-[11.5px] font-semibold mt-2" style={{ color: changeColor }}>{change}</div>
            </motion.div>
          ))}
        </div>

        {/* Explore Courses */}
        <div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center justify-between mb-4">
            <span className="text-[17px] font-semibold text-[#1A1523]" style={{ letterSpacing: '-0.02em' }}>Explore Courses</span>
            <Link href="/courses" className="text-[12.5px] font-semibold text-[#7C5CDB] no-underline hover:opacity-75 transition-opacity">View all →</Link>
          </motion.div>
          {exploreCourses.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl p-12 text-center border border-[#E9E7EF]">
              <p className="text-[13px] text-[#9591A8]">No published courses yet.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exploreCourses.map((course, i) => {
                const thumb      = getCourseThumb(course.title)
                const total      = totalLessonsInCourse(course.modules)
                const isEnrolled = enrolledCourseIds.has(course.id)
                return (
                  <motion.div key={course.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.08, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(124,92,219,0.16)' }}
                    className="bg-white rounded-2xl overflow-hidden border border-[#E9E7EF] cursor-pointer"
                    style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)', transition: 'border-color 0.2s' }}
                  >
                    <Link href={`/courses/${course.id}`} className="no-underline block">
                      <div className="h-[120px] flex items-center justify-center" style={{ background: thumb.bg }}>
                        <span className="text-[48px]" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>{thumb.icon}</span>
                      </div>
                      <div className="p-4">
                        <div className="text-[14px] font-semibold text-[#1A1523] mb-1.5 truncate">{course.title}</div>
                        <div className="flex items-center gap-2 text-[12px] text-[#9591A8] mb-3">
                          <span>{total} lessons</span><span>·</span>
                          <DifficultyBadge difficulty={course.difficulty} />
                        </div>
                        <div className="w-full py-2 rounded-xl text-[12.5px] font-semibold text-center transition-all duration-150"
                          style={{ background: isEnrolled ? '#7C5CDB' : '#EDE8FF', color: isEnrolled ? '#fff' : '#7C5CDB' }}>
                          {isEnrolled ? 'Continue' : 'Start Course'}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* My Courses */}
        <div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-between mb-4">
            <span className="text-[17px] font-semibold text-[#1A1523]" style={{ letterSpacing: '-0.02em' }}>My Courses</span>
            <Link href="/progress" className="text-[12.5px] font-semibold text-[#7C5CDB] no-underline hover:opacity-75 transition-opacity">See progress →</Link>
          </motion.div>
          {enrolledRows.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.4 }}
              className="bg-white rounded-2xl p-10 text-center border border-[#E9E7EF]">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#EDE8FF' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C5CDB" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-[#1A1523] mb-1">No courses yet</p>
              <p className="text-[13px] text-[#9591A8] mb-4">Enroll in a course to start your journey</p>
              <Link href="/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white no-underline" style={{ background: '#7C5CDB' }}>
                Browse courses →
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.4 }}
              className="bg-white rounded-2xl overflow-hidden border border-[#E9E7EF]" style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>
              <div className="grid gap-4 px-5 py-3 border-b border-[#F0EEF7]" style={{ gridTemplateColumns: '2fr 1fr 2fr auto', background: '#F7F7F9' }}>
                {['Course', 'Started', 'Progress', ''].map((h, i) => (
                  <span key={i} className="text-[11px] font-semibold uppercase tracking-[0.7px] text-[#9591A8]">{h}</span>
                ))}
              </div>
              {enrolledRows.map(({ course, enrolledAt }, idx) => {
                const prog  = progressList.find(p => p.courseId === course.id)
                const pct   = prog?.percentage ?? 0
                const done  = prog?.completedLessons ?? 0
                const total = prog?.totalLessons ?? 0
                const thumb = getCourseThumb(course.title)
                const mod   = course.modules.find(m => m.lessons.some(() => !prog || done < total)) ?? course.modules[course.modules.length - 1]
                return (
                  <motion.div key={course.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.06, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                    className="grid gap-4 px-5 py-4 items-center"
                    style={{ gridTemplateColumns: '2fr 1fr 2fr auto', borderBottom: idx < enrolledRows.length - 1 ? '1px solid #F0EEF7' : 'none', transition: 'background 0.12s', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FAF8FF'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div>
                      <div className="text-[13.5px] font-semibold text-[#1A1523] truncate">{thumb.icon} {course.title}</div>
                      <div className="text-[11.5px] text-[#9591A8] mt-0.5">{mod ? `Module ${mod.order + 1} of ${course.modules.length}` : `${course.modules.length} modules`}</div>
                    </div>
                    <div className="text-[12.5px] text-[#9591A8]">
                      {new Date(enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E9E7EF' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7C5CDB,#6146C4)', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                      </div>
                      <span className="text-[11.5px] text-[#9591A8]">{pct}% · {done}/{total} lessons</span>
                    </div>
                    <Link href={`/courses/${course.id}`} className="text-[12.5px] font-semibold text-[#7C5CDB] no-underline hover:opacity-75 transition-opacity whitespace-nowrap">
                      Continue →
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* ══ Right Sidebar ═══════════════════════════════════ */}
      <div className="w-full lg:w-[278px] shrink-0 p-6 lg:pl-0 flex flex-col gap-4">

        {/* Calendar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white rounded-2xl overflow-hidden border border-[#E9E7EF]" style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="px-4 py-4">
            <MiniCalendar classDates={classDates} assignmentDates={assignmentDates} />
          </div>
        </motion.div>

        {/* Live Classes */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white rounded-2xl overflow-hidden border border-[#E9E7EF]" style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid #E9E7EF' }}>
            <span className="text-[13.5px] font-semibold text-[#1A1523]">Upcoming Live Classes</span>
            <Link href="/live-classes" className="text-[11.5px] font-semibold text-[#7C5CDB] no-underline hover:opacity-75">View all</Link>
          </div>
          <div className="px-4 py-1">
            {upcomingClasses.length === 0
              ? <p className="text-[13px] text-[#9591A8] py-3">No classes scheduled.</p>
              : upcomingClasses.map((cls, i) => {
                  const date     = new Date(cls.scheduledAt)
                  const live     = cls.status === 'LIVE'
                  const todayCls = isToday(date)
                  const tomorrowCls = isSameDay(date, new Date(now.getTime() + 86_400_000))
                  const statusLabel = live ? 'LIVE NOW' : todayCls ? 'Today' : tomorrowCls ? 'Tomorrow'
                    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  return (
                    <motion.div key={cls.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}
                      className="py-3 flex flex-col gap-1" style={{ borderBottom: i < upcomingClasses.length - 1 ? '1px solid #F0EEF7' : 'none' }}>
                      {live
                        ? <span className="self-start inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />LIVE NOW
                          </span>
                        : <span className="self-start inline-flex text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EDE8FF', color: '#7C5CDB' }}>{statusLabel}</span>
                      }
                      <div className="text-[13px] font-semibold text-[#1A1523]">{cls.title}</div>
                      <div className="text-[11.5px] text-[#9591A8]">{formatDate(date)} · {formatTime(date)}</div>
                      <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="mt-1 self-start px-3 py-1.5 rounded-lg font-semibold text-[11.5px] no-underline transition-all duration-150"
                        style={{ background: live || todayCls ? '#7C5CDB' : '#EDE8FF', color: live || todayCls ? '#fff' : '#7C5CDB' }}>
                        {live || todayCls ? 'Join Class →' : 'Set Reminder'}
                      </a>
                    </motion.div>
                  )
                })
            }
          </div>
          <AIQuickInput />
        </motion.div>

        {/* Upcoming Assignments */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white rounded-2xl overflow-hidden border border-[#E9E7EF]" style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid #E9E7EF' }}>
            <span className="text-[13.5px] font-semibold text-[#1A1523]">Upcoming Assignments</span>
            <Link href="/assignments" className="text-[11.5px] font-semibold text-[#7C5CDB] no-underline hover:opacity-75">View all</Link>
          </div>
          <div className="px-4 py-1">
            {upcomingAssignments.length === 0
              ? <p className="text-[13px] text-[#9591A8] py-3">All caught up! 🎉</p>
              : upcomingAssignments.map((a, i) => {
                  const daysLeft  = a.dueDate ? Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / 86_400_000) : null
                  const isUrgent  = daysLeft !== null && daysLeft <= 0
                  const isWarning = daysLeft !== null && daysLeft > 0 && daysLeft <= 2
                  const dotBg     = isUrgent ? '#DC2626' : isWarning ? '#D97706' : '#16A34A'
                  const dueColor  = isUrgent ? '#DC2626' : isWarning ? '#D97706' : '#9591A8'
                  const dueLabel  = isUrgent ? 'Due today' : daysLeft === 1 ? '1 day' : daysLeft !== null ? `${daysLeft} days` : 'No deadline'
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.05 }}
                      className="flex items-start gap-2.5 py-3" style={{ borderBottom: i < upcomingAssignments.length - 1 ? '1px solid #F0EEF7' : 'none' }}>
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: dotBg }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold text-[#1A1523] truncate">{a.title}</div>
                        <div className="text-[11.5px] text-[#9591A8] truncate">{a.lesson.module.course.title}</div>
                      </div>
                      <div className="text-[11.5px] font-semibold whitespace-nowrap" style={{ color: dueColor }}>{dueLabel}</div>
                    </motion.div>
                  )
                })
            }
          </div>
        </motion.div>
      </div>
    </div>
  )
}