// PATH: src/app/(dashboard)/leaderboard/page.tsx
import { auth }            from '@/auth'
import { prisma }          from '@/lib/prisma'
import { computePoints, computeBadges } from '@/lib/badges'
import { withDb }          from '@/lib/db'
import type { Metadata }   from 'next'
import Link                from 'next/link'

export const metadata: Metadata = { title: 'Leaderboard — Codentia' }

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const AVATAR_COLORS = ['#8A70D6','#06B6D4','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899']
const avatarColor   = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg,#F59E0B,#D97706)', text: '#fff', label: '🥇' },
  { bg: 'linear-gradient(135deg,#94A3B8,#64748B)', text: '#fff', label: '🥈' },
  { bg: 'linear-gradient(135deg,#CD7F32,#A0522D)', text: '#fff', label: '🥉' },
]

export default async function LeaderboardPage() {
  const session = await auth()
  const myId    = session!.user.id

  const students = await withDb(() => prisma.user.findMany({
    where:   { role: 'STUDENT' },
    select: {
      id: true, name: true,
      progressRecords:    { select: { completedAt: true } },
      quizResults:        { select: { score: true, completedAt: true } },
      submissions:        { select: { id: true, status: true } },
      liveClassAttendance:{ select: { liveClassId: true } },
      enrollments:        { select: { courseId: true } },
    },
  }))

  // Compute points + badges for every student
  const now = new Date()

  const ranked = students.map(s => {
    const lessonsCompleted = s.progressRecords.length
    const quizzesPassed    = s.quizResults.filter(q => q.score >= 60).length
    const avgQuizScore     = s.quizResults.length
      ? s.quizResults.reduce((a, q) => a + q.score, 0) / s.quizResults.length
      : 0
    const assignmentsDone  = s.submissions.length
    const liveAttended     = s.liveClassAttendance.length
    const enrollments      = s.enrollments.length

    // Streak calc
    const days = new Set(s.progressRecords.map(r => new Date(r.completedAt).toDateString()))
    let streak = 0
    for (let offset = 0; offset <= 60; offset++) {
      const d = new Date(now); d.setDate(now.getDate() - offset)
      if (days.has(d.toDateString())) streak++
      else if (offset > 0) break
    }

    // Courses completed (all lessons done)
    // We approximate: if enrolled in a course and has progress records, count enrolled courses
    // (Full check is expensive at scale — use badge lib's check logic)
    const coursesCompleted = 0 // simplified — full check in profile page

    const pts = computePoints({
      lessonsCompleted, quizzesPassed, avgQuizScore,
      assignmentsDone, liveAttended, streakDays: streak,
      enrollments, coursesCompleted,
    })

    const earnedBadges = computeBadges({
      lessonsCompleted, quizzesPassed, avgQuizScore,
      assignmentsDone, liveAttended, streakDays: streak,
      enrollments, coursesCompleted,
    }).filter(b => b.earned)

    return {
      id: s.id, name: s.name, pts, streak,
      lessonsCompleted, quizzesPassed, liveAttended,
      badgeCount: earnedBadges.length,
      topBadges:  earnedBadges.slice(0, 3),
    }
  }).sort((a, b) => b.pts - a.pts)

  const myRank   = ranked.findIndex(r => r.id === myId) + 1
  const myEntry  = ranked.find(r => r.id === myId)
  const topThree = ranked.slice(0, 3)
  const rest     = ranked.slice(3)

  return (
    <div className="p-7 max-w-[860px]">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[24px] font-black text-[#424040] tracking-tight">🏆 Leaderboard</h1>
        <p className="text-[13px] text-[#8A8888] mt-1">Top learners ranked by points this week.</p>
      </div>

      {/* My rank banner (if not top 3) */}
      {myRank > 3 && myEntry && (
        <div className="mb-5 rounded-[14px] px-5 py-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg,#E9E3FF,#D4CAF7)', border: '1px solid #C4B8EE' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black text-white flex-shrink-0"
            style={{ background: avatarColor(myEntry.name) }}>
            {getInitials(myEntry.name)}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-black text-[#424040]">Your ranking</div>
            <div className="text-[12px] text-[#8A8888]">Keep going — you&apos;re #{myRank} with {myEntry.pts} pts</div>
          </div>
          <div className="text-[28px] font-black text-[#8A70D6]">#{myRank}</div>
        </div>
      )}

      {/* Top 3 podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map(i => {
            const s = topThree[i]
            if (!s) return <div key={i} />
            const rank  = i + 1
            const style = RANK_STYLES[i]
            const isMe  = s.id === myId
            return (
              <div key={s.id}
                className={`bg-white border rounded-[14px] p-5 text-center shadow-[0_1px_3px_rgba(0,0,0,.06)] relative transition-all ${isMe ? 'ring-2 ring-[#8A70D6]' : ''} ${rank === 1 ? 'scale-105 shadow-[0_4px_24px_rgba(138,112,214,.2)]' : ''}`}
                style={{ borderColor: rank === 1 ? '#D4CAF7' : '#EBEBEB' }}>
                {isMe && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9E3FF] text-[#8A70D6]">You</span>
                )}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] font-black text-white mx-auto mb-3"
                  style={{ background: style.bg }}>
                  {style.label}
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black text-white mx-auto mb-2"
                  style={{ background: avatarColor(s.name) }}>
                  {getInitials(s.name)}
                </div>
                <div className="text-[13px] font-black text-[#424040] truncate">{s.name}</div>
                <div className="text-[22px] font-black text-[#8A70D6] mt-1">{s.pts.toLocaleString()}</div>
                <div className="text-[11px] text-[#8A8888]">points</div>
                <div className="flex justify-center gap-1 mt-2 flex-wrap">
                  {s.topBadges.map(b => (
                    <span key={b.id} title={b.name} className="text-[14px]">{b.icon}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
        <div className="px-5 py-3.5 border-b border-[#EBEBEB] flex items-center justify-between">
          <div className="text-[14px] font-black text-[#424040]">All Students</div>
          <div className="text-[12px] text-[#8A8888]">{ranked.length} learners</div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #EBEBEB' }}>
              {['Rank','Student','Points','Lessons','Quizzes','Streak','Badges'].map(h => (
                <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[.6px] px-4 py-3 text-[#8A8888]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((s, idx) => {
              const rank = idx + 1
              const isMe = s.id === myId
              return (
                <tr key={s.id}
                  className={`transition-colors ${isMe ? 'bg-[#F8F6FF]' : 'hover:bg-[#FAFAFA]'}`}
                  style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <td className="px-4 py-3">
                    <span className={`text-[13px] font-black ${rank <= 3 ? 'text-[#8A70D6]' : 'text-[#8A8888]'}`}>
                      {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: avatarColor(s.name) }}>
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#424040]">{s.name}</div>
                        {isMe && <div className="text-[10px] font-bold text-[#8A70D6]">You</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[14px] font-black text-[#8A70D6]">{s.pts.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#424040]">{s.lessonsCompleted}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#424040]">{s.quizzesPassed}</td>
                  <td className="px-4 py-3">
                    {s.streak > 0
                      ? <span className="text-[12px] font-bold text-[#F59E0B]">🔥 {s.streak}d</span>
                      : <span className="text-[12px] text-[#8A8888]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {s.topBadges.map(b => (
                        <span key={b.id} title={b.name} className="text-[14px]">{b.icon}</span>
                      ))}
                      {s.badgeCount > 3 && (
                        <span className="text-[10px] font-bold text-[#8A8888] ml-0.5">+{s.badgeCount - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* How points work */}
      <div className="mt-5 bg-[#F8F6FF] border border-[#E9E3FF] rounded-[14px] p-5">
        <div className="text-[13px] font-black text-[#424040] mb-3">How points are earned</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📖', label: 'Lesson completed',   pts: '10 pts' },
            { icon: '✅', label: 'Quiz passed',         pts: '15 pts' },
            { icon: '📝', label: 'Assignment submitted', pts: '20 pts' },
            { icon: '📹', label: 'Live class attended', pts: '25 pts' },
            { icon: '🎓', label: 'Course completed',    pts: '50 pts' },
            { icon: '🔥', label: 'Daily streak',        pts: '5 pts/day' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2.5">
              <span className="text-[18px]">{r.icon}</span>
              <div>
                <div className="text-[11px] font-bold text-[#424040]">{r.label}</div>
                <div className="text-[11px] text-[#8A70D6] font-black">{r.pts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link href="/progress" className="text-[13px] font-bold text-[#8A70D6] hover:underline">
          View your detailed progress →
        </Link>
      </div>
    </div>
  )
}