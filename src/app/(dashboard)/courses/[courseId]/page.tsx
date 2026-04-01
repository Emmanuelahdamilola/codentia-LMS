// PATH: src/app/(dashboard)/courses/[courseId]/page.tsx
import { auth }       from '@/auth'
import { prisma }     from '@/lib/prisma'
import { notFound }   from 'next/navigation'
import Link           from 'next/link'
import type { Metadata } from 'next'
import { getCourseProgress } from '@/lib/progress'
import EnrollButton   from '@/components/dashboard/EnrollButton'
import type { Difficulty } from '@prisma/client'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Props {
  params: Promise<{ courseId: string }>
}

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params
  const course = await prisma.course.findUnique({
    where:  { id: courseId },
    select: { title: true },
  })
  return { title: course ? `${course.title} — Codentia` : 'Course' }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Beginner',     cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    INTERMEDIATE: { label: 'Intermediate', cls: 'bg-[#FEF3C7] text-[#D97706]' },
    ADVANCED:     { label: 'Advanced',     cls: 'bg-[#FEE2E2] text-[#DC2626]' },
  }
  const { label, cls } = map[difficulty]
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params
  const session      = await auth()
  const userId       = session!.user.id

  // Fetch course with all modules + lessons
  const course = await prisma.course.findUnique({
    where:   { id: courseId, published: true },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id:            true,
              title:         true,
              order:         true,
              hasQuiz:       true,
              hasAssignment: true,
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) notFound()

  // Check enrollment + progress
  const [enrollment, progress] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),
    getCourseProgress(userId, courseId),
  ])

  const isEnrolled   = !!enrollment
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0)

  // First incomplete lesson (resume point)
  const completedIds = progress
    ? await prisma.progressRecord.findMany({
        where:  { userId, lesson: { module: { courseId } } },
        select: { lessonId: true },
      }).then(rows => new Set(rows.map(r => r.lessonId)))
    : new Set<string>()

  const firstLesson       = course.modules[0]?.lessons[0]
  const firstIncomplete   = course.modules
    .flatMap(m => m.lessons)
    .find(l => !completedIds.has(l.id))
  const resumeLesson      = firstIncomplete ?? firstLesson

  return (
    <div className="p-7 max-w-[960px]">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-[#9591A8] mb-5">
        <Link href="/dashboard" className="text-[#7C5CDB] hover:underline">Dashboard</Link>
        <span>›</span>
        <Link href="/courses" className="text-[#7C5CDB] hover:underline">Courses</Link>
        <span>›</span>
        <span className="truncate text-[#1A1523]">{course.title}</span>
      </nav>

      {/* Course header card */}
      <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-6 mb-5 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <DifficultyBadge difficulty={course.difficulty} />
              {course.category && (
                <span className="text-[11px] font-bold text-[#9591A8] bg-[#F7F7F9] border border-[#E9E7EF] px-2.5 py-0.5 rounded-full">
                  {course.category}
                </span>
              )}
            </div>
            <h1 className="text-[24px] font-black text-[#1A1523] tracking-tight leading-tight mb-2">
              {course.title}
            </h1>
            <p className="text-[14px] text-[#9591A8] leading-relaxed mb-4 max-w-xl">
              {course.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-[12px] text-[#9591A8] flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {course.modules.length} modules
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {totalLessons} lessons
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {course._count.enrollments} enrolled
              </span>
              {/* Price display */}
              {(course as any).price > 0 ? (
                <span className="flex items-center gap-1.5 font-black text-[#7C5CDB]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  ${(course as any).price.toFixed(2)}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#22C55E] font-bold">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Free
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            {isEnrolled && progress && (
              <div className="text-right mb-1">
                <div className="text-[12px] text-[#9591A8] mb-1">Your progress</div>
                <div className="w-[140px] h-1.5 bg-[#E9E7EF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7C5CDB] rounded-full transition-all duration-700"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#9591A8] mt-1 text-right">
                  {progress.completedLessons} / {progress.totalLessons} lessons
                </div>
              </div>
            )}

            {isEnrolled && resumeLesson ? (
              <Link
                href={`/courses/${courseId}/learn/${resumeLesson.id}`}
                className="flex items-center gap-2 bg-[#7C5CDB] text-white font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-[#6146C4] transition-colors whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {progress && progress.completedLessons > 0 ? 'Continue Learning' : 'Start Learning'}
              </Link>
            ) : (
              <EnrollButton
                courseId={courseId}
                priceUsd={(course as any).price ?? null}
                enrolled={isEnrolled}
                published={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="bg-white border border-[#E9E7EF] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
        <div className="px-5 py-4 border-b border-[#E9E7EF]">
          <h2 className="text-[15px] font-bold text-[#1A1523]">Course Curriculum</h2>
          <p className="text-[12px] text-[#9591A8] mt-0.5">
            {course.modules.length} modules · {totalLessons} lessons
          </p>
        </div>

        {course.modules.map((mod, modIdx) => {
          const modDone = mod.lessons.filter(l => completedIds.has(l.id)).length
          return (
            <div key={mod.id} className={modIdx < course.modules.length - 1 ? 'border-b border-[#E9E7EF]' : ''}>
              {/* Module header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#F7F7F9]">
                <div>
                  <div className="text-[13px] font-bold text-[#1A1523]">{mod.title}</div>
                  <div className="text-[11px] text-[#9591A8] mt-0.5">
                    {mod.lessons.length} lessons
                    {isEnrolled && modDone > 0 && ` · ${modDone} completed`}
                  </div>
                </div>
                {isEnrolled && modDone === mod.lessons.length && mod.lessons.length > 0 && (
                  <span className="text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                    Complete
                  </span>
                )}
              </div>

              {/* Lessons */}
              {mod.lessons.map((lesson, lessonIdx) => {
                const isDone  = completedIds.has(lesson.id)
                const isResume = resumeLesson?.id === lesson.id && isEnrolled

                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      lessonIdx < mod.lessons.length - 1 ? 'border-b border-[#E9E7EF]' : ''
                    } ${isEnrolled ? 'hover:bg-[#F7F7F9] transition-colors' : ''}`}
                  >
                    {/* Status dot */}
                    <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center
                      ${isDone
                        ? 'bg-[#7C5CDB]'
                        : isEnrolled
                          ? 'border-2 border-[#E9E7EF] bg-white'
                          : 'border-2 border-[#E9E7EF] bg-[#F7F7F9]'
                      }`}>
                      {isDone && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      {isEnrolled ? (
                        <Link
                          href={`/courses/${courseId}/learn/${lesson.id}`}
                          className={`text-[13px] truncate block hover:text-[#7C5CDB] transition-colors ${
                            isDone ? 'text-[#9591A8]' : 'text-[#1A1523] font-medium'
                          }`}
                        >
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className="text-[13px] text-[#9591A8] truncate block">
                          {lesson.title}
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {lesson.hasQuiz && (
                        <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-full">
                          Quiz
                        </span>
                      )}
                      {lesson.hasAssignment && (
                        <span className="text-[10px] font-bold bg-[#EDE8FF] text-[#7C5CDB] px-1.5 py-0.5 rounded-full">
                          Project
                        </span>
                      )}
                      {isResume && (
                        <span className="text-[10px] font-bold bg-[#7C5CDB] text-white px-2 py-0.5 rounded-full">
                          Resume →
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}