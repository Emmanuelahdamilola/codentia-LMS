// PATH: src/app/(dashboard)/courses/page.tsx
import { auth }               from '@/auth'
import { prisma }             from '@/lib/prisma'
import { getAllCourseProgress } from '@/lib/progress'
import Link                   from 'next/link'
import type { Metadata }      from 'next'
import type { Difficulty }    from '@prisma/client'

export const metadata: Metadata = { title: 'Courses — Codentia' }

function getCourseThumb(title: string) {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css'))         return { bg: 'linear-gradient(135deg,#FF6B35,#F7931E)', icon: '🌐' }
  if (t.includes('javascript') || t.includes('js'))    return { bg: 'linear-gradient(135deg,#F0DB4F,#E8C41A)', icon: '⚡' }
  if (t.includes('react'))                             return { bg: 'linear-gradient(135deg,#61DAFB,#21A1C4)', icon: '⚛️' }
  if (t.includes('python'))                            return { bg: 'linear-gradient(135deg,#3572A5,#2B5F8A)', icon: '🐍' }
  if (t.includes('node'))                              return { bg: 'linear-gradient(135deg,#68A063,#3D7A3A)', icon: '🟢' }
  if (t.includes('typescript') || t.includes('ts'))   return { bg: 'linear-gradient(135deg,#3178C6,#235A97)', icon: '🔷' }
  return { bg: 'linear-gradient(135deg,#7C5CDB,#6146C4)', icon: '📚' }
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Beginner',     cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    INTERMEDIATE: { label: 'Intermediate', cls: 'bg-[#FEF3C7] text-[#D97706]' },
    ADVANCED:     { label: 'Advanced',     cls: 'bg-[#FEE2E2] text-[#DC2626]' },
  }
  const { label, cls } = map[difficulty]
  return <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${cls}`}>{label}</span>
}

export default async function CoursesPage() {
  const session = await auth()
  const userId  = session!.user.id

  const [courses, enrollments, progressList] = await Promise.all([
    prisma.course.findMany({
      where:   { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, description: true, difficulty: true,
        thumbnail: true, price: true,
        modules: { select: { _count: { select: { lessons: true } } } },
        _count:  { select: { enrollments: true } },
      },
    }),
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
    getAllCourseProgress(userId),
  ])

  const enrolledIds = new Set(enrollments.map(e => e.courseId))
  const sorted = [...courses].sort((a, b) => {
    const aE = enrolledIds.has(a.id) ? 1 : 0
    const bE = enrolledIds.has(b.id) ? 1 : 0
    return bE - aE
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#1A1523]" style={{ letterSpacing: '-0.025em' }}>Courses</h1>
        <p className="text-[#9591A8] text-[13.5px] mt-1">Browse all available courses and track your progress.</p>
      </div>

      {/* Filter pills — CSS only, no JS handlers */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(f => (
          <span key={f}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-semibold cursor-pointer select-none
              border border-[#E9E7EF] text-[#9591A8] bg-white
              hover:border-[#7C5CDB] hover:text-[#7C5CDB] hover:bg-[#EDE8FF]
              transition-all duration-150"
          >{f}</span>
        ))}
      </div>

      {/* Course grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-16 text-center border border-[#E9E7EF]">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#EDE8FF]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C5CDB" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1A1523] mb-1">No courses yet</p>
          <p className="text-[13px] text-[#9591A8]">Check back soon — new courses are being added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {sorted.map((course, i) => {
            const enrolled     = enrolledIds.has(course.id)
            const progress     = progressList.find(p => p.courseId === course.id)
            const totalLessons = course.modules.reduce((s, m) => s + m._count.lessons, 0)
            const thumb        = getCourseThumb(course.title)
            const isComplete   = progress?.percentage === 100

            return (
              /* CSS-only hover via group + Tailwind — no onMouseEnter/Leave */
              <Link key={course.id} href={`/courses/${course.id}`}
                className="group animate-fade-up bg-white rounded-2xl overflow-hidden flex flex-col no-underline
                  border border-[#E9E7EF] hover:border-[#C8C1E8]
                  shadow-[0_2px_8px_rgba(15,13,26,0.06)] hover:shadow-[0_16px_40px_rgba(124,92,219,0.16)]
                  hover:-translate-y-1 transition-all duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Thumbnail */}
                <div className="h-[120px] sm:h-[130px] flex items-center justify-center relative" style={{ background: thumb.bg }}>
                  <span className="text-[44px] sm:text-[50px]" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>
                    {thumb.icon}
                  </span>
                  <span className="absolute top-3 right-3"><DifficultyBadge difficulty={course.difficulty} /></span>
                  {isComplete && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                      style={{ background: 'rgba(22,163,74,0.9)', color: '#fff' }}>
                      ✓ Complete
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <h3 className="text-[14px] sm:text-[14.5px] font-semibold text-[#1A1523] mb-1.5 truncate
                    group-hover:text-[#7C5CDB] transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-[12.5px] text-[#9591A8] mb-4 flex-1 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[12px] text-[#9591A8] mb-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {totalLessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      {course._count.enrollments}
                    </span>
                    {course.price && course.price > 0
                      ? <span className="font-semibold ml-auto text-[#7C5CDB]">${course.price.toFixed(2)}</span>
                      : <span className="font-semibold ml-auto text-[#16A34A]">Free</span>
                    }
                  </div>

                  {/* Progress */}
                  {enrolled && progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[11.5px] mb-1.5">
                        <span className="text-[#9591A8]">Progress</span>
                        <span className="font-semibold text-[#1A1523]">{progress.percentage}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-[#E9E7EF]">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress.percentage}%`, background: 'linear-gradient(90deg,#7C5CDB,#6146C4)' }} />
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="w-full py-2.5 rounded-xl font-semibold text-[13px] text-center transition-opacity duration-150 group-hover:opacity-85"
                    style={{
                      background: enrolled ? '#7C5CDB' : '#EDE8FF',
                      color: enrolled ? '#fff' : '#7C5CDB',
                    }}>
                    {enrolled ? (isComplete ? '✓ Review Course' : 'Continue →') : 'View Course →'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}