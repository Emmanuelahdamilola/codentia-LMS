// PATH: src/app/(dashboard)/courses/[courseId]/learn/[lessonId]/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import MarkCompleteButton from '@/components/dashboard/MarkCompleteButton'
import LessonAIPanel from '@/components/dashboard/LessonAIPanel'
import LessonSidebarClient from '@/components/dashboard/LessonSidebarClient'
import LessonNotes from '@/components/dashboard/LessonNotes'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>
}

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { title: true },
  })
  return { title: lesson ? `${lesson.title} — Codentia` : 'Lesson' }
}

// ─────────────────────────────────────────────────────────────
// Markdown → HTML (minimal, safe, no external dep)
// ─────────────────────────────────────────────────────────────

function renderContent(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>(\n|$))+/g, '<ul>$&</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '<p>')
    .replace(/<p><\/p>/g, '')
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function LessonPage({ params }: Props) {
  const { courseId, lessonId } = await params
  const session = await auth()
  const userId  = session!.user.id

  // ── Fetch lesson with all relations ─────────────────────
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, title: true },
          },
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true, hasQuiz: true, hasAssignment: true },
          },
        },
      },
      quiz:       { select: { id: true, title: true } },
      assignment: { select: { id: true, title: true } },
      resources:  { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!lesson) notFound()

  // ── Verify enrollment ────────────────────────────────────
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.course.id } },
  })
  if (!enrollment) notFound()

  // ── Parallel data fetches ────────────────────────────────
  const [
    completedRecord,
    courseProgress,
    allModulesWithLessons,
    completedLessonIds,
  ] = await Promise.all([
    // Is this specific lesson completed?
    prisma.progressRecord.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
    }),

    // Full course progress (for the progress widget)
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.module.course.id } },
    }).then(async () => {
      const course = await prisma.course.findUnique({
        where: { id: lesson.module.course.id },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: { id: true },
              },
            },
          },
        },
      })
      if (!course) return { total: 0, done: 0, pct: 0 }
      const allIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
      const doneCount = await prisma.progressRecord.count({
        where: { userId, lessonId: { in: allIds } },
      })
      return {
        total: allIds.length,
        done:  doneCount,
        pct:   allIds.length > 0 ? Math.round((doneCount / allIds.length) * 100) : 0,
      }
    }),

    // All modules for the lesson sidebar (full course structure)
    prisma.module.findMany({
      where: { courseId: lesson.module.course.id },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, order: true, hasQuiz: true, hasAssignment: true },
        },
      },
    }),

    // Which lesson IDs has this user completed in this course?
    prisma.progressRecord.findMany({
      where: {
        userId,
        lesson: { module: { courseId: lesson.module.course.id } },
      },
      select: { lessonId: true },
    }).then(rows => new Set(rows.map(r => r.lessonId))),
  ])

  // ── Lesson navigation (within same module) ───────────────
  const siblings   = lesson.module.lessons
  const currentIdx = siblings.findIndex(l => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const nextLesson = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  // Module progress
  const moduleDoneCount = siblings.filter(l => completedLessonIds.has(l.id)).length

  // ── Circumference for the SVG donut ─────────────────────
  // r=40 → C = 2πr ≈ 251.3
  const CIRC        = 251.3
  const dashOffset  = CIRC - (courseProgress.pct / 100) * CIRC

  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-60px)]">

      {/* ══ Lesson list sidebar ═══════════════════════════════ */}
      <LessonSidebarClient
        courseTitle={lesson.module.course.title}
        moduleTitle={lesson.module.title}
        courseProgress={courseProgress}
        modules={allModulesWithLessons}
        completedLessonIds={[...completedLessonIds]}
        currentLessonId={lessonId}
        courseId={courseId}
      />

      {/* ══ Main lesson content ════════════════════════════════ */}
      <div className="flex-1 min-w-0 px-7 py-6" style={{ maxWidth: 780 }}>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-[#9591A8] mb-4">
          <Link href="/dashboard" className="text-[#7C5CDB] hover:underline">Dashboard</Link>
          <span>›</span>
          <Link href={`/courses/${courseId}`} className="text-[#7C5CDB] hover:underline truncate max-w-[140px]">
            {lesson.module.course.title}
          </Link>
          <span>›</span>
          <span className="truncate max-w-[160px]">{lesson.module.title}</span>
        </nav>

        {/* Lesson title + meta */}
        <div className="mb-5">
          <h1 className="text-[24px] font-black text-[#1A1523] tracking-tight leading-tight">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[12px] text-[#9591A8]">
              {/* clock icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              ~10 min
            </span>
            <span className="bg-[#EDE8FF] text-[#7C5CDB] text-[11px] font-bold px-2 py-0.5 rounded-full">
              Lesson {lesson.order + 1} of {siblings.length}
            </span>
            {completedRecord && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#22C55E] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Video player */}
        {lesson.videoUrl ? (
          <div className="rounded-[14px] overflow-hidden mb-6 bg-[#1a1a2e]" style={{ aspectRatio: '16/9' }}>
            {lesson.videoUrl.match(/\.(mp4|webm|mov|ogg)(\?|$)/i) ? (
              // Self-hosted video from R2 — native HTML5 player
              <video
                src={lesson.videoUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full"
                preload="metadata"
                style={{ background: '#1a1a2e' }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              // Embed URL — YouTube, Vimeo, Loom, etc.
              <iframe
                src={lesson.videoUrl}
                title={lesson.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        ) : (
          /* Video placeholder */
          <div
            className="rounded-[14px] overflow-hidden mb-6 relative flex flex-col items-center justify-center"
            style={{ aspectRatio: '16/9', background: '#1a1a2e' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(138,112,214,.9)', border: '3px solid rgba(255,255,255,.5)' }}>
                <svg className="w-7 h-7 ml-1" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <p className="text-[14px] font-bold text-white/90">{lesson.title}</p>
              <p className="text-[12px] text-white/50">Video coming soon</p>
            </div>
          </div>
        )}

        {/* Lesson body content */}
        {lesson.content && (
          <div
            className="prose-lesson mb-6"
            dangerouslySetInnerHTML={{ __html: renderContent(lesson.content) }}
          />
        )}

        {/* Resources */}
        {lesson.resources.length > 0 && (
          <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-4 mb-6 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <h3 className="text-[13px] font-bold text-[#1A1523] mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#7C5CDB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Resources
            </h3>
            <div className="flex flex-col gap-2">
              {lesson.resources.map(r => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] text-[#7C5CDB] hover:underline font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  {r.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quiz + Assignment CTAs */}
        {(lesson.quiz || lesson.assignment) && (
          <div className="flex gap-3 flex-wrap mb-6">
            {lesson.quiz && (
              <Link
                href={`/quizzes/${lesson.quiz.id}`}
                className="flex items-center gap-2 bg-[#EDE8FF] text-[#7C5CDB] border border-[#D4CAF7] font-bold text-[13px] px-4 py-2.5 rounded-lg hover:bg-[#7C5CDB] hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Take Quiz: {lesson.quiz.title}
              </Link>
            )}
            {lesson.assignment && (
              <Link
                href={`/assignments/${lesson.assignment.id}`}
                className="flex items-center gap-2 bg-[#EDE8FF] text-[#7C5CDB] border border-[#D4CAF7] font-bold text-[13px] px-4 py-2.5 rounded-lg hover:bg-[#7C5CDB] hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Assignment: {lesson.assignment.title}
              </Link>
            )}
          </div>
        )}

        {/* AI Panel — inline (always visible, matches blueprint) */}
        <LessonAIPanel lessonId={lesson.id} lessonTitle={lesson.title} />

        {/* Lesson actions */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E9E7EF]">
          {prevLesson ? (
            <Link
              href={`/courses/${courseId}/learn/${prevLesson.id}`}
              className="flex items-center gap-2 bg-white text-[#1A1523] border border-[#E9E7EF] font-bold text-[13px] px-5 py-2.5 rounded-lg hover:border-[#7C5CDB] hover:text-[#7C5CDB] transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Previous Lesson
            </Link>
          ) : (
            <div />
          )}

          <MarkCompleteButton
            lessonId={lesson.id}
            isCompleted={!!completedRecord}
            nextLessonHref={nextLesson ? `/courses/${courseId}/learn/${nextLesson.id}` : undefined}
          />

          {nextLesson ? (
            <Link
              href={`/courses/${courseId}/learn/${nextLesson.id}`}
              className="flex items-center gap-2 bg-white text-[#1A1523] border border-[#E9E7EF] font-bold text-[13px] px-5 py-2.5 rounded-lg hover:border-[#7C5CDB] hover:text-[#7C5CDB] transition-all duration-200"
            >
              Next Lesson
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* ══ Right panel ════════════════════════════════════════ */}
      <div className="w-[260px] flex-shrink-0 px-5 py-6 flex flex-col gap-4">

        {/* Course progress donut */}
        <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
          <div className="text-[13px] font-bold text-[#1A1523] mb-2">Course Progress</div>

          {/* SVG donut */}
          <div className="flex justify-center my-3">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#E9E7EF" strokeWidth="8" />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#7C5CDB"
                strokeWidth="8"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 48 48)"
              />
              <text x="48" y="44" textAnchor="middle" fontFamily="Lato,sans-serif" fontWeight="900" fontSize="18" fill="#1A1523">
                {courseProgress.pct}%
              </text>
              <text x="48" y="58" textAnchor="middle" fontFamily="Lato,sans-serif" fontSize="10" fill="#9591A8">
                complete
              </text>
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#9591A8]">Lessons done</span>
              <span className="font-bold text-[#1A1523]">{courseProgress.done} / {courseProgress.total}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#9591A8]">This module</span>
              <span className="font-bold text-[#1A1523]">{moduleDoneCount} / {siblings.length}</span>
            </div>
          </div>
        </div>

        {/* Notes widget */}
        <LessonNotes lessonId={lessonId} />

      </div>
    </div>
  )
}