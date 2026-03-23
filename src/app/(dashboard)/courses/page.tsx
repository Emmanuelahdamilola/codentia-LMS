// PATH: src/app/(dashboard)/courses/page.tsx
import { auth }              from '@/auth'
import { prisma }            from '@/lib/prisma'
import { getAllCourseProgress } from '@/lib/progress'
import Link                  from 'next/link'
import type { Metadata }     from 'next'
import type { Difficulty }   from '@prisma/client'

export const metadata: Metadata = { title: 'Courses — Codentia' }

function getCourseThumb(title: string) {
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

export default async function CoursesPage() {
  const session = await auth()
  const userId  = session!.user.id

  const [courses, enrollments, progressList] = await Promise.all([
    prisma.course.findMany({
      where:   { published: true },
      include: {
        _count:   { select: { enrollments: true } },
        modules:  { select: { _count: { select: { lessons: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
    getAllCourseProgress(userId),
  ])

  const enrolledIds     = new Set(enrollments.map(e => e.courseId))
  const difficultyOrder: Record<Difficulty, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 }
  const sorted          = [...courses].sort(
    (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
  )

  return (
    <div className="p-7">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-black text-[#424040] tracking-tight">Courses</h1>
        <p className="text-[#8A8888] text-[13px] mt-1">
          Browse all available courses and track your progress.
        </p>
      </div>

      {/* Difficulty filter pills (visual only — filtering can be added later) */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(f => (
          <button
            key={f}
            className="px-4 py-1.5 rounded-full text-[12px] font-bold border border-[#EBEBEB] text-[#8A8888] hover:border-[#8A70D6] hover:text-[#8A70D6] hover:bg-[#E9E3FF] transition-all duration-150"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-16 text-center">
          <p className="text-[#8A8888] text-[13px]">No courses published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(course => {
            const enrolled    = enrolledIds.has(course.id)
            const progress    = progressList.find(p => p.courseId === course.id)
            const totalLessons = course.modules.reduce((s, m) => s + m._count.lessons, 0)
            const thumb       = getCourseThumb(course.title)

            return (
              <div
                key={course.id}
                className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(138,112,214,.12)] hover:border-[#D4CAF7] transition-all duration-200"
              >
                {/* Thumbnail */}
                <div
                  className="h-[120px] flex items-center justify-center relative"
                  style={{ background: thumb.bg }}
                >
                  <span className="text-[44px]" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.2))' }}>
                    {thumb.icon}
                  </span>
                  <span className="absolute top-3 right-3">
                    <DifficultyBadge difficulty={course.difficulty} />
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-[14px] font-bold text-[#424040] mb-1 truncate">
                    {course.title}
                  </h3>
                  <p className="text-[12px] text-[#8A8888] mb-3 flex-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px] text-[#8A8888] mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      {totalLessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {course._count.enrollments} enrolled
                    </span>
                    {/* Price badge */}
                    {(course as any).price > 0 ? (
                      <span className="font-black text-[#8A70D6]">
                        ${(course as any).price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-bold text-[#22C55E]">Free</span>
                    )}
                  </div>

                  {/* Progress bar (enrolled only) */}
                  {enrolled && progress && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] text-[#8A8888] mb-1">
                        <span>Progress</span>
                        <span className="font-bold text-[#424040]">{progress.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8A70D6] rounded-full transition-all duration-700"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/courses/${course.id}`}
                    className={`w-full py-2 rounded-lg font-bold text-[12px] text-center transition-all duration-200 ${
                      enrolled
                        ? 'bg-[#8A70D6] text-white hover:bg-[#6B52B8]'
                        : 'bg-[#E9E3FF] text-[#8A70D6] border border-[#D4CAF7] hover:bg-[#8A70D6] hover:text-white'
                    }`}
                  >
                    {enrolled
                      ? progress?.percentage === 100 ? '✓ Completed' : 'Continue'
                      : 'View Course'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}