// PATH: src/app/(dashboard)/dashboard/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAllCourseProgress } from '@/lib/progress'
import { formatDate, formatTime, isToday, isSameDay } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Difficulty } from '@prisma/client'
import AIQuickInput from '@/components/dashboard/AIQuickInput'

export const metadata: Metadata = { title: 'Dashboard — Codentia' }

// ─────────────────────────────────────────────────────────────
// Pure helpers (no DB, safe to call anywhere)
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
  return { bg: 'linear-gradient(135deg,#8A70D6 0%,#6B52B8 100%)', icon: '📚' }
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Beginner',     cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    INTERMEDIATE: { label: 'Intermediate', cls: 'bg-[#FEF3C7] text-[#D97706]' },
    ADVANCED:     { label: 'Advanced',     cls: 'bg-[#FEE2E2] text-[#DC2626]' },
  }
  const { label, cls } = map[difficulty]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Mini Calendar (server, Monday-first)
// ─────────────────────────────────────────────────────────────

interface CalendarProps {
  classDates:      Date[]
  assignmentDates: Date[]
}

function MiniCalendar({ classDates, assignmentDates }: CalendarProps) {
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()

  // Monday-first offset
  let firstDay = new Date(year, month, 1).getDay()
  firstDay = firstDay === 0 ? 6 : firstDay - 1

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const classSet    = new Set(classDates.map(d => d.getDate()))
  const assignSet   = new Set(assignmentDates.map(d => d.getDate()))

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-[#424040]">{monthLabel}</span>
        <div className="flex gap-1">
          {(['prev', 'next'] as const).map(dir => (
            <button
              key={dir}
              aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
              className="w-6 h-6 flex items-center justify-center rounded text-[#8A8888] hover:bg-[#E9E3FF] hover:text-[#8A70D6] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {dir === 'prev'
                  ? <polyline points="15 18 9 12 15 6" />
                  : <polyline points="9 18 15 12 9 6" />}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-px text-center mb-0.5">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-[#B0AEAE] py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-px text-center">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const isCurrentDay  = d === today.getDate()
          const hasClass      = classSet.has(d)
          const hasAssignment = assignSet.has(d)

          return (
            <div
              key={i}
              className={`relative flex items-center justify-center h-7 rounded-full text-[11px] transition-all duration-150 cursor-pointer
                ${isCurrentDay
                  ? 'bg-[#8A70D6] text-white font-bold'
                  : (hasClass || hasAssignment)
                    ? 'text-[#424040] font-bold'
                    : 'text-[#8A8888] hover:bg-[#E9E3FF] hover:text-[#8A70D6]'
                }`}
            >
              {d}
              {!isCurrentDay && (hasClass || hasAssignment) && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: hasClass ? '#8A70D6' : '#F59E0B' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8A70D6] inline-block flex-shrink-0" />
          <span className="text-[11px] text-[#8A8888]">Live class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block flex-shrink-0" />
          <span className="text-[11px] text-[#8A8888]">Assignment due</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // ── Auth guard ───────────────────────────────────────────
  const session = await auth()
  if (!session) redirect('/login')  // ← fix: guard against null session

  const userId    = session.user.id
  const firstName = session.user.name?.split(' ')[0] ?? 'there'
  const now       = new Date()

  // ── Parallel data fetch ──────────────────────────────────
  const [
    progressList,
    quizzesPassed,
    pendingCount,
    attendedCount,
    upcomingClasses,
    exploreCourses,
    enrolledRows,
    submittedAssignmentIds,
    weekProgress,
    streakRecords,
  ] = await Promise.all([
    getAllCourseProgress(userId),

    prisma.quizResult.count({
      where: { userId, score: { gte: 60 } },
    }),

    prisma.submission.count({
      where: { userId, status: 'PENDING' },
    }),

    prisma.liveClassAttendance.count({
      where: { userId },
    }),

    prisma.liveClass.findMany({
      where: {
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 2,
      select: {
        id:          true,
        title:       true,
        instructor:  true,
        meetingLink: true,
        scheduledAt: true,
        durationMins: true,
        status:      true,
        course:      { select: { title: true } },
      },
    }),

    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id:         true,
        title:      true,
        difficulty: true,
        modules: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
    }),

    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      take: 4,
      select: {
        enrolledAt: true,
        course: {
          select: {
            id:         true,
            title:      true,
            difficulty: true,
            modules: {
              orderBy: { order: 'asc' },
              select: {
                id:    true,
                title: true,
                order: true,
                lessons: {
                  select: { id: true, order: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    }),

    prisma.submission.findMany({
      where: { userId },
      select: { assignmentId: true },
    }),

    prisma.progressRecord.count({
      where: {
        userId,
        completedAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    prisma.progressRecord.findMany({
      where: {
        userId,
        completedAt: {
          gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        },
      },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    }),
  ])

  // ── Derived values ───────────────────────────────────────
  const lessonsCompleted = progressList.reduce((sum, p) => sum + p.completedLessons, 0)

  const assignmentsDone = await prisma.submission.count({
    where: {
      userId,
      status: { in: ['GRADED', 'INSTRUCTOR_REVIEWED', 'AI_REVIEWED'] },
    },
  })

  let streak = 0
  const completionDays = new Set(
    streakRecords.map(r => r.completedAt.toDateString())
  )
  for (let offset = 0; offset <= 60; offset++) {
    const day = new Date(now)
    day.setDate(now.getDate() - offset)
    if (completionDays.has(day.toDateString())) {
      streak++
    } else if (offset > 0) {
      break
    }
  }

  function totalLessonsInCourse(
    modules: { _count: { lessons: number } }[]
  ): number {
    return modules.reduce((s, m) => s + m._count.lessons, 0)
  }

  const enrolledCourseIds = new Set(enrolledRows.map(e => e.course.id))
  const submittedIds      = new Set(submittedAssignmentIds.map(s => s.assignmentId))

  // ── Upcoming assignments (not yet submitted) ─────────────
  const courseIds = enrolledRows.map(e => e.course.id)
  const upcomingAssignments = courseIds.length > 0
    ? await prisma.assignment.findMany({
        where: {
          lesson: { module: { courseId: { in: courseIds } } },
          ...(submittedIds.size > 0 ? { id: { notIn: [...submittedIds] } } : {}),
          OR: [
            { dueDate: { gte: now } },
            { dueDate: null },
          ],
        },
        orderBy: [{ dueDate: 'asc' }],
        take: 3,
        select: {
          id:      true,
          title:   true,
          dueDate: true,
          lesson: {
            select: {
              module: {
                select: {
                  course: { select: { title: true } },
                },
              },
            },
          },
        },
      })
    : []

  // ── Calendar event dates ─────────────────────────────────
  const classDates      = upcomingClasses.map(c => new Date(c.scheduledAt))
  const assignmentDates = upcomingAssignments
    .filter(a => a.dueDate)
    .map(a => new Date(a.dueDate!))

  // ── Stats config ─────────────────────────────────────────
  const stats = [
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      colorClass:  'bg-[#E9E3FF] text-[#8A70D6]',
      value:       lessonsCompleted,
      label:       'Lessons completed',
      change:      `↑ ${weekProgress} this week`,
      changeColor: '#22C55E',
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      colorClass:  'bg-[#DCFCE7] text-[#16A34A]',
      value:       quizzesPassed,
      label:       'Quizzes passed',
      change:      '↑ avg 82%',
      changeColor: '#22C55E',
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      colorClass:  'bg-[#FEF3C7] text-[#D97706]',
      value:       assignmentsDone,
      label:       'Assignments done',
      change:      `${pendingCount} pending`,
      changeColor: '#F59E0B',
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      colorClass:  'bg-[#DBEAFE] text-[#2563EB]',
      value:       attendedCount,
      label:       'Live classes attended',
      change:      upcomingClasses.length > 0 ? 'Next: Tonight' : 'None scheduled',
      changeColor: '#8A70D6',
    },
  ] as const

  const activeProgress = progressList.find(p => p.percentage > 0 && p.percentage < 100)
  const welcomeSub = activeProgress
    ? `Continue your ${activeProgress.courseTitle} journey — you're ${activeProgress.percentage}% through.`
    : enrolledRows.length > 0
      ? "You have courses waiting — let's keep the momentum going!"
      : 'Start your first course and begin your coding journey!'

  const continueHref = activeProgress
    ? `/courses/${activeProgress.courseId}`
    : '/courses'

  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-60px)]">

      {/* ══ Main content ══════════════════════════════════════ */}
      <div className="flex-1 min-w-0 p-7">

        {/* Welcome Banner */}
        <div
          className="rounded-[14px] p-6 flex items-center justify-between mb-7 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#8A70D6 0%,#6B52B8 100%)' }}
        >
          <span className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full bg-white/[0.07] pointer-events-none" aria-hidden />
          <span className="absolute right-[60px] -bottom-14 w-[140px] h-[140px] rounded-full bg-white/[0.05] pointer-events-none" aria-hidden />

          <div className="relative z-10">
            <h2 className="text-[20px] font-black text-white tracking-tight">
              Welcome back, {firstName} 👋
            </h2>
            <p className="text-[13px] text-white/80 mt-1 max-w-md">
              {welcomeSub}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 rounded-full px-2.5 py-1 text-[12px] font-bold text-white">
                  🔥 {streak} day streak
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 rounded-full px-2.5 py-1 text-[12px] font-bold text-white">
                ⚡ {weekProgress} lessons this week
              </span>
            </div>
          </div>

          <Link
            href={continueHref}
            className="relative z-10 flex-shrink-0 bg-white/20 border-[1.5px] border-white/50 text-white font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all duration-200 whitespace-nowrap"
          >
            Continue Learning →
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-7">
          {stats.map(({ icon, colorClass, value, label, change, changeColor }) => (
            <div
              key={label}
              className="bg-white border border-[#EBEBEB] rounded-[10px] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] flex flex-col gap-1"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClass}`}>
                {icon}
              </div>
              <div className="text-[22px] font-black text-[#424040] tracking-tight leading-none">{value}</div>
              <div className="text-[12px] text-[#8A8888]">{label}</div>
              <div className="text-[11px] font-bold" style={{ color: changeColor }}>{change}</div>
            </div>
          ))}
        </div>

        {/* Explore Courses */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[16px] font-bold text-[#424040]">Explore Courses</span>
          <Link href="/courses" className="text-[12px] font-bold text-[#8A70D6] hover:underline">
            View all →
          </Link>
        </div>

        {exploreCourses.length === 0 ? (
          <p className="text-sm text-[#8A8888] mb-7">No published courses yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3.5 mb-7">
            {exploreCourses.map(course => {
              const thumb      = getCourseThumb(course.title)
              const total      = totalLessonsInCourse(course.modules)
              const isEnrolled = enrolledCourseIds.has(course.id)
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(138,112,214,.12)] hover:border-[#D4CAF7] no-underline block"
                >
                  <div
                    className="h-[120px] flex items-center justify-center"
                    style={{ background: thumb.bg }}
                  >
                    <span className="text-[44px]" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.2))' }}>
                      {thumb.icon}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <div className="text-[14px] font-bold text-[#424040] mb-1 truncate">{course.title}</div>
                    <div className="flex items-center gap-2 text-[12px] text-[#8A8888] mb-3 flex-wrap">
                      <span>{total} lesson{total !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <DifficultyBadge difficulty={course.difficulty} />
                    </div>
                    <div className="w-full py-2 rounded-md bg-[#E9E3FF] text-[#8A70D6] font-bold text-[12px] text-center hover:bg-[#8A70D6] hover:text-white transition-all duration-200">
                      {isEnrolled ? 'Continue' : 'Start Course'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* My Courses */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[16px] font-bold text-[#424040]">My Courses</span>
          <Link href="/progress" className="text-[12px] font-bold text-[#8A70D6] hover:underline">
            See progress →
          </Link>
        </div>

        {enrolledRows.length === 0 ? (
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-10 text-center text-[#8A8888] text-sm mb-7">
            You haven&apos;t enrolled in any courses yet.{' '}
            <Link href="/courses" className="text-[#8A70D6] font-bold hover:underline">
              Browse courses →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] mb-7">
            <div className="grid grid-cols-[2fr_1fr_2fr_auto] items-center px-5 py-3 border-b border-[#EBEBEB] bg-[#FBFBFB] gap-4">
              {['Course', 'Started', 'Progress', ''].map((h, i) => (
                <span key={i} className="text-[11px] font-bold uppercase tracking-[.8px] text-[#8A8888]">{h}</span>
              ))}
            </div>

            {enrolledRows.map(({ course, enrolledAt }, idx) => {
              const prog  = progressList.find(p => p.courseId === course.id)
              const pct   = prog?.percentage ?? 0
              const done  = prog?.completedLessons ?? 0
              const total = prog?.totalLessons ?? 0
              const thumb = getCourseThumb(course.title)

              const currentModule = course.modules.find(m => {
                const moduleTotal = m.lessons.length
                const moduleDone  = prog ? Math.min(done, moduleTotal) : 0
                return moduleDone < moduleTotal
              }) ?? course.modules[course.modules.length - 1]

              const moduleLabel = currentModule
                ? `Module ${currentModule.order + 1} of ${course.modules.length}`
                : `${course.modules.length} modules`

              return (
                <div
                  key={course.id}
                  className={`grid grid-cols-[2fr_1fr_2fr_auto] items-center px-5 py-3.5 gap-4 ${
                    idx < enrolledRows.length - 1 ? 'border-b border-[#EBEBEB]' : ''
                  }`}
                >
                  <div>
                    <div className="text-[13px] font-bold text-[#424040] truncate">
                      {thumb.icon} {course.title}
                    </div>
                    <div className="text-[11px] text-[#8A8888] mt-0.5">{moduleLabel}</div>
                  </div>

                  <div className="text-[12px] text-[#8A8888]">
                    {new Date(enrolledAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8A70D6] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#8A8888]">
                      {pct}% · {done} of {total} lessons
                    </span>
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className="text-[12px] font-bold text-[#8A70D6] hover:underline whitespace-nowrap"
                  >
                    Continue →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ Right widgets ════════════════════════════════════ */}
      <div className="w-[296px] flex-shrink-0 p-7 pl-0 flex flex-col gap-4">

        {/* Calendar widget */}
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <MiniCalendar classDates={classDates} assignmentDates={assignmentDates} />
          </div>
        </div>

        {/* Live Classes + AI Quick Input */}
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EBEBEB]">
            <span className="text-[13px] font-bold text-[#424040]">Upcoming Live Classes</span>
            <Link href="/live-classes" className="text-[11px] font-bold text-[#8A70D6] hover:underline">
              View all
            </Link>
          </div>

          <div className="px-4 py-1">
            {upcomingClasses.length === 0 ? (
              <p className="text-[13px] text-[#8A8888] py-3">No classes scheduled.</p>
            ) : (
              upcomingClasses.map((cls, i) => {
                const date     = new Date(cls.scheduledAt)
                const live     = cls.status === 'LIVE'
                const today    = isToday(date)
                const tomorrow = isSameDay(date, new Date(now.getTime() + 86_400_000))

                const statusLabel = live ? 'LIVE NOW'
                  : today    ? 'Today'
                  : tomorrow ? 'Tomorrow'
                  : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

                return (
                  <div
                    key={cls.id}
                    className={`py-2.5 flex flex-col gap-1 ${
                      i < upcomingClasses.length - 1 ? 'border-b border-[#EBEBEB]' : ''
                    }`}
                  >
                    {live ? (
                      <span className="self-start inline-flex items-center gap-1 bg-[#FEE2E2] text-[#EF4444] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-[.5px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="self-start inline-flex bg-[#E9E3FF] text-[#8A70D6] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {statusLabel}
                      </span>
                    )}

                    <div className="text-[13px] font-bold text-[#424040]">{cls.title}</div>
                    <div className="text-[11px] text-[#8A8888]">
                      {formatDate(date)} · {formatTime(date)} · {cls.instructor}
                    </div>

                    <a
                      href={cls.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-1.5 self-start px-3 py-1.5 rounded-md font-bold text-[11px] transition-all duration-200 ${
                        live || today
                          ? 'bg-[#8A70D6] text-white hover:bg-[#6B52B8]'
                          : 'bg-[#E9E3FF] text-[#8A70D6] hover:bg-[#8A70D6] hover:text-white'
                      }`}
                    >
                      {live || today ? 'Join Class →' : 'Set Reminder'}
                    </a>
                  </div>
                )
              })
            )}
          </div>

          <AIQuickInput />
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EBEBEB]">
            <span className="text-[13px] font-bold text-[#424040]">Upcoming Assignments</span>
            <Link href="/assignments" className="text-[11px] font-bold text-[#8A70D6] hover:underline">
              View all
            </Link>
          </div>

          <div className="px-4 py-1">
            {upcomingAssignments.length === 0 ? (
              <p className="text-[13px] text-[#8A8888] py-3">All caught up! 🎉</p>
            ) : (
              upcomingAssignments.map((a, i) => {
                const daysLeft = a.dueDate
                  ? Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / 86_400_000)
                  : null

                const isUrgent  = daysLeft !== null && daysLeft <= 0
                const isWarning = daysLeft !== null && daysLeft > 0 && daysLeft <= 2
                const dotColor  = isUrgent ? 'bg-[#EF4444]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
                const dueColor  = isUrgent ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#8A8888]'
                const dueLabel  = isUrgent   ? 'Due today'
                  : daysLeft === 1           ? '1 day'
                  : daysLeft !== null        ? `${daysLeft} days`
                  : 'No deadline'

                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-2.5 py-2.5 ${
                      i < upcomingAssignments.length - 1 ? 'border-b border-[#EBEBEB]' : ''
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-[#424040] truncate">{a.title}</div>
                      <div className="text-[11px] text-[#8A8888] truncate">
                        {a.lesson.module.course.title}
                      </div>
                    </div>
                    <div className={`text-[11px] font-bold whitespace-nowrap ${dueColor}`}>
                      {dueLabel}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}