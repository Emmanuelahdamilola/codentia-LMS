// PATH: src/components/dashboard/ProgressClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Stats { lessonsCompleted: number; quizzesPassed: number; quizzesTotal: number; assignmentsDone: number; liveAttended: number; streak: number }
interface CourseRow { courseId: string; courseTitle: string; pct: number; done: number; total: number }
interface QuizRow { score: number; title: string; courseTitle: string; date: string }
interface ActivityRow { id: string; lessonTitle: string; courseTitle: string; completedAt: string }
interface ModuleRow { id: string; title: string; courseId: string; courseTitle: string; pct: number }

interface Props {
  stats:          Stats
  progressList:   CourseRow[]
  quizResults:    QuizRow[]
  recentActivity: ActivityRow[]
  heatmapData:    number[]   // 28 values 0-4
  modulesWithPct: ModuleRow[]
}

function getCourseThumb(title: string) {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css')) return { bg: 'linear-gradient(135deg,#FF6B35,#F7931E)', icon: '🏷️', bar: 'linear-gradient(to right,#FF6B35,#F7931E)' }
  if (t.includes('javascript') || t.includes('js')) return { bg: 'linear-gradient(135deg,#F0DB4F,#E8C41A)', icon: '⚡', bar: 'linear-gradient(to right,#8A70D6,#6B52B8)' }
  if (t.includes('react')) return { bg: 'linear-gradient(135deg,#61DAFB,#21A1C4)', icon: '⚛️', bar: 'linear-gradient(to right,#61DAFB,#21A1C4)' }
  return { bg: 'linear-gradient(135deg,#8A70D6,#6B52B8)', icon: '📚', bar: 'linear-gradient(to right,#8A70D6,#6B52B8)' }
}

function heatmapColor(v: number) {
  return ['#EBEBEB','#C4B5FD','#A78BFA','#7C3AED','#6B52B8'][v]
}

type ChartFilter = 'all' | string

export default function ProgressClient({ stats, progressList, quizResults, recentActivity, heatmapData, modulesWithPct }: Props) {
  const [chartFilter, setChartFilter] = useState<ChartFilter>('all')

  // Derive unique course titles for chart filter
  const chartCourses = [...new Set(quizResults.map(q => q.courseTitle))]

  const filteredQuiz = chartFilter === 'all' ? quizResults : quizResults.filter(q => q.courseTitle === chartFilter)

  const donutCirc  = 100.53 // 2π × 16
  const donutPassed = stats.quizzesTotal > 0 ? (stats.quizzesPassed / stats.quizzesTotal) * donutCirc : 0

  // AI recommendations based on real data
  const recs: { icon: string; text: string }[] = []
  if (quizResults.some(q => q.score < 70)) {
    const low = quizResults.filter(q => q.score < 70).sort((a,b) => a.score - b.score)[0]
    recs.push({ icon: '📈', text: `Review "${low.title}" — you scored ${low.score}%. Revisiting this lesson will strengthen this concept.` })
  }
  if (stats.streak === 0) recs.push({ icon: '⏰', text: 'Study more consistently. Short daily sessions of 25–30 minutes are more effective than long weekend sessions.' })
  if (stats.quizzesPassed > 0 && progressList.some(p => p.pct >= 50)) {
    recs.push({ icon: '🚀', text: `You're making great progress! Keep it up — you've completed ${stats.lessonsCompleted} lessons so far.` })
  }
  if (recs.length === 0) recs.push({ icon: '🎯', text: 'Complete your first quiz to receive personalised AI study recommendations.' })

  return (
    <div className="p-7">
      <div className="flex gap-6">

        {/* ══ Main ══════════════════════════════════════════ */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-black text-[#424040] tracking-tight mb-1">My Progress</h1>
          <p className="text-[13px] text-[#8A8888] mb-6">Track your learning journey, quiz performance, and study habits.</p>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, color: 'bg-[#E9E3FF] text-[#8A70D6]', value: stats.lessonsCompleted, label: 'Lessons Completed', change: '↑ this week' },
              { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, color: 'bg-[#DCFCE7] text-[#16A34A]', value: stats.quizzesPassed, label: 'Quizzes Passed', change: `of ${stats.quizzesTotal} taken` },
              { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, color: 'bg-[#FEF3C7] text-[#D97706]', value: stats.assignmentsDone, label: 'Assignments Done', change: 'submitted' },
              { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: 'bg-[#DBEAFE] text-[#2563EB]', value: stats.liveAttended, label: 'Live Classes Attended', change: 'attended' },
            ].map(({ icon, color, value, label, change }) => (
              <div key={label} className="bg-white border border-[#EBEBEB] rounded-[10px] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>{icon}</div>
                <div className="text-[22px] font-black text-[#424040] tracking-tight leading-none">{value}</div>
                <div className="text-[12px] text-[#8A8888] mt-0.5">{label}</div>
                <div className="text-[11px] font-bold text-[#22C55E] mt-0.5">{change}</div>
              </div>
            ))}
          </div>

          {/* Course Progress */}
          <div className="text-[15px] font-bold text-[#424040] mb-3">Course Progress</div>
          <div className="flex flex-col gap-3 mb-6">
            {progressList.length === 0 ? (
              <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-10 text-center text-[13px] text-[#8A8888]">
                Enrol in a course to start tracking progress.
              </div>
            ) : progressList.map(p => {
              const thumb = getCourseThumb(p.courseTitle)
              // Group modules for this course
              const courseMods = modulesWithPct.filter(m => m.courseTitle === p.courseTitle)
              return (
                <div key={p.courseId} className="bg-white border border-[#EBEBEB] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0" style={{ background: thumb.bg }}>
                      {thumb.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#424040] truncate">{p.courseTitle}</div>
                      <div className="text-[12px] text-[#8A8888]">{courseMods.length} modules · {p.total} lessons</div>
                    </div>
                    <div className="text-[20px] font-black text-[#8A70D6] flex-shrink-0">{p.pct}%</div>
                  </div>
                  <div className="h-2.5 bg-[#EBEBEB] rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct}%`, background: thumb.bar }} />
                  </div>
                  {courseMods.length > 0 && (
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(courseMods.length, 4)}, 1fr)` }}>
                      {courseMods.map(m => (
                        <div key={m.id} className="bg-[#FBFBFB] rounded-md p-2 border border-[#EBEBEB]">
                          <div className="text-[11px] font-bold text-[#424040] mb-1 truncate">{m.title}</div>
                          <div className="h-1 bg-[#EBEBEB] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: thumb.bar }} />
                          </div>
                          <div className="text-[10px] text-[#8A8888] mt-0.5 text-right">{m.pct}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quiz Score Chart */}
          {quizResults.length > 0 && (
            <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)] mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-bold text-[#424040]">Quiz Score History</span>
                <div className="flex gap-1.5">
                  {(['all', ...chartCourses] as const).map(f => (
                    <button key={f} onClick={() => setChartFilter(f)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold border-none transition-all duration-150 ${chartFilter === f ? 'bg-[#8A70D6] text-white' : 'bg-[#FBFBFB] text-[#8A8888] hover:bg-[#E9E3FF] hover:text-[#8A70D6]'}`}>
                      {f === 'all' ? 'All' : f.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2.5 h-[140px] pb-6 relative">
                <div className="absolute bottom-6 left-0 right-0 h-px bg-[#EBEBEB]" />
                {filteredQuiz.map((q, i) => {
                  const h       = Math.round((q.score / 100) * 100)
                  const isLow   = q.score < 70
                  const isJs    = q.courseTitle.toLowerCase().includes('javascript')
                  const barBg   = isLow ? 'linear-gradient(to top,#EF4444,#F87171)' : isJs ? 'linear-gradient(to top,#6B52B8,#8A70D6)' : 'linear-gradient(to top,#E8580A,#FF6B35)'
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end" style={{ height: 100 }}>
                        <div className="w-full max-w-[36px] mx-auto rounded-t-[4px] transition-all duration-600" style={{ height: h, background: barBg, minHeight: 4 }} />
                      </div>
                      <div className="text-[10px] text-[#8A8888] font-bold text-center">Q{i + 1}</div>
                      <div className="text-[10px] text-[#8A8888] text-center">{q.score}%</div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#8A70D6' }} /><span className="text-[11px] text-[#8A8888]">JavaScript</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#FF6B35' }} /><span className="text-[11px] text-[#8A8888]">HTML/CSS</span></div>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="rounded-[14px] p-5 relative overflow-hidden mb-2" style={{ background: 'linear-gradient(135deg,#8A70D6 0%,#6B52B8 100%)' }}>
            <span className="absolute -right-10 -top-10 w-[160px] h-[160px] rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,.07)' }} />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="w-[30px] h-[30px] rounded-lg bg-white/20 flex items-center justify-center text-[16px]">🤖</span>
              <span className="text-[14px] font-bold text-white">AI Study Recommendations</span>
            </div>
            <div className="flex flex-col gap-2 relative z-10">
              {recs.map((r, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,.15)' }}>
                  <span className="text-[14px] flex-shrink-0 mt-0.5">{r.icon}</span>
                  <p className="text-[12px] text-white/90 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Right column ══════════════════════════════════ */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* Heatmap */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="px-4 py-3.5 border-b border-[#EBEBEB]"><span className="text-[13px] font-bold text-[#424040]">Activity — Last 4 Weeks</span></div>
            <div className="px-4 py-3">
              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="text-center text-[9px] font-bold text-[#B0AEAE]">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {heatmapData.map((v, i) => (
                  <div key={i} className="aspect-square rounded-[3px] cursor-default" style={{ background: heatmapColor(v) }} title={`${v * 30} mins`} />
                ))}
              </div>
              <div className="flex items-center gap-1 mt-2 justify-end">
                <span className="text-[10px] text-[#8A8888]">Less</span>
                {[0,1,2,3,4].map(v => <div key={v} className="w-3 h-3 rounded-[2px]" style={{ background: heatmapColor(v) }} />)}
                <span className="text-[10px] text-[#8A8888]">More</span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EBEBEB]">
              <span className="text-[13px] font-bold text-[#424040]">Achievements</span>
              <span className="text-[11px] text-[#8A8888]">{Math.min(4, stats.lessonsCompleted > 9 ? 4 : stats.quizzesPassed > 0 ? 2 : 1)} / 6 earned</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
              {[
                { icon: '🔥', label: '7-Day Streak', earned: stats.streak >= 7 },
                { icon: '⚡', label: 'First Quiz',   earned: stats.quizzesTotal > 0 },
                { icon: '🏆', label: 'Perfect Score', earned: stats.quizzesPassed > 0 },
                { icon: '📚', label: '10 Lessons',   earned: stats.lessonsCompleted >= 10 },
                { icon: '🎯', label: '50 Lessons',   earned: stats.lessonsCompleted >= 50 },
                { icon: '🌟', label: 'Top Scorer',   earned: false },
              ].map((a, i) => (
                <div key={i} className={`rounded-[10px] border px-2 py-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 ${a.earned ? 'bg-[#E9E3FF] border-[#D4CAF7]' : 'bg-[#FBFBFB] border-[#EBEBEB] opacity-55'}`}>
                  <div className="text-[22px] mb-1">{a.icon}</div>
                  <div className="text-[10px] font-bold text-[#424040] leading-tight">{a.label}</div>
                  {!a.earned && <div className="text-[10px] text-[#8A8888] mt-0.5">🔒</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Quiz donut */}
          {stats.quizzesTotal > 0 && (
            <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
              <div className="px-4 py-3.5 border-b border-[#EBEBEB]"><span className="text-[13px] font-bold text-[#424040]">Quiz Performance</span></div>
              <div className="px-4 py-4 flex items-center gap-4">
                <svg viewBox="0 0 36 36" className="w-20 h-20 flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#EBEBEB" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#8A70D6" strokeWidth="3.5"
                    strokeDasharray={`${(stats.quizzesPassed / stats.quizzesTotal) * 100.53} 100.53`}
                    strokeLinecap="round" />
                  <text x="18" y="22" textAnchor="middle" fontFamily="Lato" fontWeight="900" fontSize="8" fill="#424040" style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>
                    {Math.round((stats.quizzesPassed / stats.quizzesTotal) * 100)}%
                  </text>
                </svg>
                <div className="flex flex-col gap-2">
                  <div><div className="text-[20px] font-black text-[#424040]">{stats.quizzesTotal}</div><div className="text-[11px] text-[#8A8888]">Quizzes taken</div></div>
                  <div><div className="text-[16px] font-bold text-[#22C55E]">{stats.quizzesPassed}</div><div className="text-[11px] text-[#8A8888]">Passed (≥60%)</div></div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="px-4 py-3.5 border-b border-[#EBEBEB]"><span className="text-[13px] font-bold text-[#424040]">Recent Activity</span></div>
            <div className="px-4 py-2">
              {recentActivity.length === 0 ? (
                <p className="text-[13px] text-[#8A8888] py-3">No activity yet.</p>
              ) : recentActivity.slice(0, 6).map((r, i, arr) => (
                <div key={r.id} className={`flex gap-3 py-2 ${i < arr.length - 1 ? 'border-b border-[#EBEBEB]' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px]">✓</span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#424040] truncate">{r.lessonTitle}</div>
                    <div className="text-[10px] text-[#8A8888]">
                      {r.courseTitle} · {new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak */}
          {stats.streak > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-[14px] p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[20px]">🔥</span>
                <div><div className="text-[20px] font-black text-[#424040]">{stats.streak}</div><div className="text-[11px] text-[#8A8888]">Day streak</div></div>
              </div>
              <p className="text-[11px] text-orange-600 font-medium">Keep it up! Learn something today to extend your streak.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
