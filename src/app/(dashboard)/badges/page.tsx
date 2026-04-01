// PATH: src/app/(dashboard)/badges/page.tsx
import { auth }            from '@/auth'
import { prisma }          from '@/lib/prisma'
import { withDb }          from '@/lib/db'
import { computeBadges, computePoints } from '@/lib/badges'
import type { Metadata }   from 'next'

export const metadata: Metadata = { title: 'Badges & Achievements — Codentia' }

export default async function BadgesPage() {
  const session = await auth()
  const userId  = session!.user.id
  const now     = new Date()

  const [progressRecords, quizResults, submissions, liveAttended, enrollments] =
    await withDb(() => Promise.all([
      prisma.progressRecord.findMany({
        where:  { userId },
        select: { completedAt: true },
      }),
      prisma.quizResult.findMany({
        where:  { userId },
        select: { score: true, completedAt: true },
      }),
      prisma.submission.findMany({
        where:  { userId },
        select: { id: true, status: true },
      }),
      prisma.liveClassAttendance.count({ where: { userId } }),
      prisma.enrollment.count({ where: { userId } }),
    ]))

  const lessonsCompleted = progressRecords.length
  const quizzesPassed    = quizResults.filter(q => q.score >= 60).length
  const avgQuizScore     = quizResults.length
    ? quizResults.reduce((a, q) => a + q.score, 0) / quizResults.length
    : 0
  const assignmentsDone = submissions.length

  // Streak
  const days = new Set(progressRecords.map(r => new Date(r.completedAt).toDateString()))
  let streak = 0
  for (let offset = 0; offset <= 60; offset++) {
    const d = new Date(now); d.setDate(now.getDate() - offset)
    if (days.has(d.toDateString())) streak++
    else if (offset > 0) break
  }

  const input = {
    lessonsCompleted, quizzesPassed, avgQuizScore,
    assignmentsDone, liveAttended, streakDays: streak,
    enrollments, coursesCompleted: 0,
  }

  const badges = computeBadges(input)
  const points = computePoints(input)
  const earned = badges.filter(b => b.earned).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[820px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1A1523] animate-fade-up" style={{ letterSpacing: "-0.025em" }} >Badges & Achievements</h1>
          <p className="text-[13px] text-[#9591A8] mt-1">
            {earned} of {badges.length} badges earned · {points.toLocaleString()} total points
          </p>
        </div>
        {/* Points pill */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#C8C1E8] animate-fade-up"
          style={{ background: 'linear-gradient(135deg,#EDE8FF,#D4CAF7)',  animationDelay: "60ms" }}>
          <span className="text-[28px]">⭐</span>
          <div>
            <div className="text-[24px] font-semibold text-[#6146C4] leading-none tracking-tight">{points.toLocaleString()}</div>
            <div className="text-[11px] font-bold text-[#7C5CDB]">Total Points</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-7">
        <div className="flex items-center justify-between text-[12px] font-bold mb-2">
          <span className="text-[#1A1523]">{earned} earned</span>
          <span className="text-[#9591A8]">{badges.length - earned} remaining</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E9E7EF' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(earned / badges.length) * 100}%`, background: 'linear-gradient(to right,#7C5CDB,#6146C4)' }} />
        </div>
      </div>

      {/* Earned badges */}
      {earned > 0 && (
        <section className="mb-7">
          <h2 className="text-[16px] font-semibold text-[#1A1523] mb-4" style={{ letterSpacing: "-0.01em" }}>Earned 🎉</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.filter(b => b.earned).map(badge => (
              <div key={badge.id}
                className="bg-white border border-[#E9E7EF] rounded-2xl p-4 flex items-center gap-4 animate-fade-up hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,92,219,0.14)] hover:border-[#C8C1E8] transition-all duration-[220ms]" style={{ boxShadow: "0 2px 8px rgba(15,13,26,0.06)" }}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-[28px] flex-shrink-0 ${badge.color}`}>
                  {badge.icon}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#1A1523]">{badge.name}</div>
                  <div className="text-[12px] text-[#9591A8] mt-0.5">{badge.description}</div>
                  <div className={`text-[11px] font-bold mt-1 ${badge.textColor}`}>✓ Earned</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked badges */}
      <section>
        <h2 className="text-[16px] font-semibold text-[#1A1523] mb-4" style={{ letterSpacing: "-0.01em" }}>Locked 🔒</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.filter(b => !b.earned).map(badge => (
            <div key={badge.id}
              className="bg-white border border-[#E9E7EF] rounded-2xl p-4 flex items-center gap-4 opacity-50" style={{ boxShadow: "0 1px 4px rgba(15,13,26,0.04)" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[28px] flex-shrink-0 bg-[#F7F7F9] grayscale">
                {badge.icon}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#1A1523]">{badge.name}</div>
                <div className="text-[12px] text-[#9591A8] mt-0.5">{badge.description}</div>
                <div className="text-[11px] font-bold mt-1 text-[#BCBBBB]">🔒 Not yet earned</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats breakdown */}
      <div className="mt-7 rounded-2xl p-5 animate-fade-up" style={{ background: "#FAF8FF", border: "1px solid #EDE8FF", animationDelay: "280ms" }}>
        <div className="text-[14px] font-semibold text-[#1A1523] mb-4">Your stats</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '📖', label: 'Lessons done',    value: lessonsCompleted },
            { icon: '✅', label: 'Quizzes passed',  value: quizzesPassed },
            { icon: '📝', label: 'Assignments',      value: assignmentsDone },
            { icon: '📹', label: 'Live classes',     value: liveAttended },
            { icon: '🔥', label: 'Day streak',       value: `${streak}d` },
            { icon: '📚', label: 'Enrolled courses', value: enrollments },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[22px] mb-1">{s.icon}</div>
              <div className="text-[20px] font-semibold text-[#7C5CDB] tracking-tight">{s.value}</div>
              <div className="text-[11px] text-[#9591A8] font-bold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}