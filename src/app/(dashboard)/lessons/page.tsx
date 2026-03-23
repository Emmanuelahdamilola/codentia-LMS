// PATH: src/app/(dashboard)/lessons/page.tsx  (My Learning / Resources)
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import Link        from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Learning — Codentia' }

function getCourseThumb(title: string) {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css')) return { bg: 'linear-gradient(135deg,#FF6B35,#F7931E)', icon: '🌐' }
  if (t.includes('javascript') || t.includes('js')) return { bg: 'linear-gradient(135deg,#F0DB4F,#E8C41A)', icon: '⚡' }
  if (t.includes('react')) return { bg: 'linear-gradient(135deg,#61DAFB,#21A1C4)', icon: '⚛️' }
  return { bg: 'linear-gradient(135deg,#8A70D6,#6B52B8)', icon: '📚' }
}

export default async function LessonsPage() {
  const session = await auth()
  const userId  = session!.user.id

  const enrollments = await prisma.enrollment.findMany({
    where:   { userId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true, order: true, hasQuiz: true, hasAssignment: true, videoUrl: true },
              },
            },
          },
        },
      },
    },
  })

  if (enrollments.length === 0) {
    return (
      <div className="p-7">
        <h1 className="text-[24px] font-black text-[#424040] tracking-tight mb-1">My Learning</h1>
        <p className="text-[13px] text-[#8A8888] mb-7">Your enrolled courses and lessons.</p>
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          <div className="w-12 h-12 rounded-xl bg-[#E9E3FF] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <p className="font-bold text-[#424040] mb-1">No courses yet</p>
          <p className="text-[13px] text-[#8A8888] mb-4">Enrol in a course to start learning.</p>
          <Link href="/courses" className="inline-block bg-[#8A70D6] text-white font-bold text-[13px] px-5 py-2 rounded-lg hover:bg-[#6B52B8] transition-colors">Browse Courses</Link>
        </div>
      </div>
    )
  }

  const completedRecords = await prisma.progressRecord.findMany({ where: { userId }, select: { lessonId: true } })
  const completedIds     = new Set(completedRecords.map(r => r.lessonId))

  return (
    <div className="p-7">
      <h1 className="text-[24px] font-black text-[#424040] tracking-tight mb-1">My Learning</h1>
      <p className="text-[13px] text-[#8A8888] mb-7">{enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled</p>

      <div className="flex flex-col gap-5">
        {enrollments.map(({ course }) => {
          const allLessons = course.modules.flatMap(m => m.lessons)
          const total      = allLessons.length
          const done       = allLessons.filter(l => completedIds.has(l.id)).length
          const pct        = total > 0 ? Math.round((done / total) * 100) : 0
          const nextLesson = allLessons.find(l => !completedIds.has(l.id))
          const thumb      = getCourseThumb(course.title)

          return (
            <div key={course.id} className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
              {/* Course header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-[#EBEBEB]">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0" style={{ background: thumb.bg }}>{thumb.icon}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-black text-[#424040] truncate">{course.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#8A70D6] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#8A70D6] flex-shrink-0">{pct}%</span>
                    <span className="text-[11px] text-[#8A8888] flex-shrink-0">{done}/{total} lessons</span>
                  </div>
                </div>
                {nextLesson ? (
                  <Link href={`/courses/${course.id}/learn/${nextLesson.id}`}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-[#8A70D6] text-white font-bold text-[12px] px-4 py-2 rounded-lg hover:bg-[#6B52B8] transition-colors">
                    Continue
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                ) : (
                  <span className="flex-shrink-0 flex items-center gap-1.5 text-[#16A34A] font-bold text-[12px] bg-[#DCFCE7] px-3 py-1.5 rounded-lg">
                    ✓ Completed
                  </span>
                )}
              </div>

              {/* Modules */}
              <div>
                {course.modules.map(module => (
                  <div key={module.id} className="border-b border-[#EBEBEB] last:border-0">
                    <div className="px-5 py-2.5 bg-[#FBFBFB]">
                      <span className="text-[11px] font-bold text-[#8A8888] uppercase tracking-wider">{module.title}</span>
                    </div>
                    <div>
                      {module.lessons.map((lesson, li) => {
                        const isDone   = completedIds.has(lesson.id)
                        const prevDone = li === 0 || completedIds.has(module.lessons[li - 1].id)
                        const isLocked = !isDone && !prevDone && li > 0
                        return (
                          <div key={lesson.id}>
                            {isLocked ? (
                              <div className="flex items-center gap-3 px-5 py-3 opacity-40 border-b border-[#EBEBEB] last:border-0">
                                <svg className="w-4 h-4 text-[#8A8888] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                <span className="text-[13px] text-[#8A8888]">{lesson.title}</span>
                              </div>
                            ) : (
                              <Link href={`/courses/${course.id}/learn/${lesson.id}`}
                                className="flex items-center gap-3 px-5 py-3 border-b border-[#EBEBEB] last:border-0 hover:bg-[#FBFBFB] transition-colors group">
                                {isDone ? (
                                  <span className="w-5 h-5 rounded-full bg-[#8A70D6] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  </span>
                                ) : (
                                  <svg className="w-5 h-5 text-[#8A70D6] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
                                )}
                                <span className={`text-[13px] flex-1 ${isDone ? 'text-[#8A8888] line-through' : 'text-[#424040] font-medium'}`}>{lesson.title}</span>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {lesson.hasQuiz       && <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-full">Quiz</span>}
                                  {lesson.hasAssignment && <span className="text-[10px] font-bold bg-[#E9E3FF] text-[#8A70D6] px-1.5 py-0.5 rounded-full">Task</span>}
                                </div>
                                <svg className="w-4 h-4 text-[#8A8888] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
