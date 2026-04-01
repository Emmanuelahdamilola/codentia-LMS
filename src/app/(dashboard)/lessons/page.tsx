// PATH: src/app/(dashboard)/lessons/page.tsx  (My Learning)
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import Link       from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Learning — Codentia' }

function getCourseThumb(title: string) {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css'))       return { bg: 'linear-gradient(135deg,#FF6B35,#F7931E)', icon: '🌐' }
  if (t.includes('javascript') || t.includes('js'))  return { bg: 'linear-gradient(135deg,#F0DB4F,#E8C41A)', icon: '⚡' }
  if (t.includes('react'))                           return { bg: 'linear-gradient(135deg,#61DAFB,#21A1C4)', icon: '⚛️' }
  if (t.includes('python'))                          return { bg: 'linear-gradient(135deg,#3572A5,#2B5F8A)', icon: '🐍' }
  if (t.includes('node'))                            return { bg: 'linear-gradient(135deg,#68A063,#3D7A3A)', icon: '🟢' }
  return { bg: 'linear-gradient(135deg,#7C5CDB,#6146C4)', icon: '📚' }
}

export default async function LessonsPage() {
  const session = await auth()
  const userId  = session!.user.id

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#1A1523]" style={{ letterSpacing: '-0.025em' }}>My Learning</h1>
          <p className="text-[13px] text-[#9591A8] mt-1">Your enrolled courses and lessons.</p>
        </div>
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-10 sm:p-16 text-center"
          style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>
          <div className="w-12 h-12 rounded-xl bg-[#EDE8FF] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#7C5CDB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <p className="font-bold text-[#1A1523] mb-1">No courses yet</p>
          <p className="text-[13px] text-[#9591A8] mb-4">Enrol in a course to start learning.</p>
          <Link href="/courses" className="inline-block bg-[#7C5CDB] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl no-underline hover:bg-[#6146C4] transition-colors">
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  const completedRecords = await prisma.progressRecord.findMany({ where: { userId }, select: { lessonId: true } })
  const completedIds     = new Set(completedRecords.map(r => r.lessonId))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#1A1523]" style={{ letterSpacing: '-0.025em' }}>My Learning</h1>
        <p className="text-[13px] text-[#9591A8] mt-1">{enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        {enrollments.map(({ course }) => {
          const allLessons = course.modules.flatMap(m => m.lessons)
          const total      = allLessons.length
          const done       = allLessons.filter(l => completedIds.has(l.id)).length
          const pct        = total > 0 ? Math.round((done / total) * 100) : 0
          const nextLesson = allLessons.find(l => !completedIds.has(l.id))
          const thumb      = getCourseThumb(course.title)

          return (
            <div key={course.id} className="bg-white border border-[#E9E7EF] rounded-2xl overflow-hidden animate-fade-up"
              style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>

              {/* Course header */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-[#E9E7EF] flex-wrap sm:flex-nowrap">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0" style={{ background: thumb.bg }}>
                  {thumb.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[14px] sm:text-[15px] font-semibold text-[#1A1523] truncate">{course.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-[#E9E7EF] rounded-full overflow-hidden min-w-0">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7C5CDB,#6146C4)' }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#7C5CDB] flex-shrink-0">{pct}%</span>
                    <span className="text-[11px] text-[#9591A8] flex-shrink-0 hidden sm:inline">{done}/{total} lessons</span>
                  </div>
                </div>
                {nextLesson ? (
                  <Link href={`/courses/${course.id}/learn/${nextLesson.id}`}
                    className="flex-shrink-0 flex items-center gap-1.5 text-white font-semibold text-[12.5px] px-3 sm:px-4 py-2 rounded-xl no-underline
                      hover:opacity-85 transition-opacity"
                    style={{ background: '#7C5CDB', boxShadow: '0 1px 2px rgba(124,92,219,0.3)', whiteSpace: 'nowrap' }}>
                    Continue
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ) : (
                  <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[#16A34A] font-bold text-[12px] bg-[#DCFCE7] px-3 py-1.5 rounded-lg">
                    ✓ Done
                  </span>
                )}
              </div>

              {/* Modules */}
              <div>
                {course.modules.map(module => (
                  <div key={module.id} className="border-b border-[#E9E7EF] last:border-0">
                    <div className="px-4 sm:px-5 py-2.5 bg-[#F7F7F9]">
                      <span className="text-[11px] font-bold text-[#9591A8] uppercase tracking-wider">{module.title}</span>
                    </div>
                    <div>
                      {module.lessons.map((lesson, li) => {
                        const isDone   = completedIds.has(lesson.id)
                        const prevDone = li === 0 || completedIds.has(module.lessons[li - 1].id)
                        const isLocked = !isDone && !prevDone && li > 0
                        return (
                          <div key={lesson.id}>
                            {isLocked ? (
                              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[#E9E7EF] last:border-0 opacity-45">
                                <svg className="w-4 h-4 text-[#9591A8] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <span className="text-[13px] text-[#9591A8] truncate">{lesson.title}</span>
                              </div>
                            ) : (
                              /* CSS group hover — no JS event handlers */
                              <Link href={`/courses/${course.id}/learn/${lesson.id}`}
                                className="group flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[#F0EEF7] last:border-0 no-underline
                                  hover:bg-[#FAF8FF] transition-colors duration-150">
                                {isDone ? (
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#7C5CDB]">
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  </span>
                                ) : (
                                  <svg className="w-5 h-5 text-[#7C5CDB] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
                                  </svg>
                                )}
                                <span className={`text-[13px] flex-1 min-w-0 truncate ${isDone ? 'text-[#9591A8] line-through' : 'text-[#1A1523] font-medium'}`}>
                                  {lesson.title}
                                </span>
                                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {lesson.hasQuiz       && <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-full hidden sm:inline">Quiz</span>}
                                  {lesson.hasAssignment && <span className="text-[10px] font-bold bg-[#EDE8FF] text-[#7C5CDB] px-1.5 py-0.5 rounded-full hidden sm:inline">Task</span>}
                                </div>
                                <svg className="w-4 h-4 text-[#9591A8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
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