// PATH: src/app/(dashboard)/assignments/[assignmentId]/page.tsx
import { auth }     from '@/auth'
import { prisma }   from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link         from 'next/link'
import type { Metadata } from 'next'
import type { Difficulty } from '@prisma/client'
import AssignmentForm from '@/components/dashboard/AssignmentForm'

interface Props { params: Promise<{ assignmentId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assignmentId } = await params
  const a = await prisma.assignment.findUnique({ where: { id: assignmentId }, select: { title: true } })
  return { title: a ? `${a.title} — Codentia` : 'Assignment' }
}

// ─── Helpers ────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Beginner',     cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    INTERMEDIATE: { label: 'Intermediate', cls: 'bg-[#FEF3C7] text-[#D97706]' },
    ADVANCED:     { label: 'Advanced',     cls: 'bg-[#FEE2E2] text-[#DC2626]' },
  }
  const { label, cls } = map[difficulty]
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{label}</span>
}

function getDueBadge(dueDate: Date | null) {
  if (!dueDate) return null
  const now      = new Date()
  const diff     = dueDate.getTime() - now.getTime()
  const daysLeft = Math.ceil(diff / 86_400_000)

  if (daysLeft <= 0)
    return { label: 'Overdue', sub: dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), bg: 'bg-[#FEE2E2] border-[#FCA5A5]', textColor: 'text-[#DC2626]', subColor: 'text-[#991B1B]' }
  if (daysLeft === 1)
    return { label: 'Due Today', sub: dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), bg: 'bg-[#FEF3C7] border-[#FDE68A]', textColor: 'text-[#D97706]', subColor: 'text-[#92400E]' }
  return { label: `${daysLeft} days left`, sub: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), bg: 'bg-[#EDE8FF] border-[#D4CAF7]', textColor: 'text-[#7C5CDB]', subColor: 'text-[#6146C4]' }
}

// Parse markdown-style description into structured content
function renderDescription(description: string) {
  const lines = description.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## '))      { elements.push(<h3 key={key++} className="text-[15px] font-bold text-[#1A1523] mt-4 mb-2 first:mt-0">{line.slice(3)}</h3>) }
    else if (line.startsWith('- '))  { elements.push(<li key={key++} className="text-[13px] text-[#1A1523] leading-relaxed ml-4 list-disc">{line.slice(2)}</li>) }
    else if (line.trim() !== '')     { elements.push(<p key={key++} className="text-[14px] text-[#1A1523] leading-[1.7] mb-2">{line}</p>) }
  }
  return elements
}

// ─── Page ───────────────────────────────────────────────────
export default async function AssignmentPage({ params }: Props) {
  const { assignmentId } = await params
  const session          = await auth()
  const userId           = session!.user.id

  const assignment = await prisma.assignment.findUnique({
    where:   { id: assignmentId },
    include: {
      lesson: {
        include: {
          module: {
            include: { course: { select: { id: true, title: true, difficulty: true } } },
          },
        },
      },
    },
  })
  if (!assignment) notFound()

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: assignment.lesson.module.course.id } },
  })
  if (!enrollment) notFound()

  const submission = await prisma.submission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
  })

  const course     = assignment.lesson.module.course
  const module_    = assignment.lesson.module
  const due        = assignment.dueDate ? new Date(assignment.dueDate) : null
  const dueBadge   = getDueBadge(due)
  const isSubmitted = !!submission

  // Parse numbered requirements from description
  const lines = assignment.description.split('\n')
  const requirements: string[] = []
  const bonusLines:   string[] = []
  let   isBonusSection = false
  for (const line of lines) {
    if (line.toLowerCase().includes('bonus')) { isBonusSection = true; continue }
    if (isBonusSection && line.startsWith('- ')) bonusLines.push(line.slice(2))
    else if (!isBonusSection && line.startsWith('- ')) requirements.push(line.slice(2))
  }

  // Parse AI feedback into bullet points
  const aiFeedbackItems = submission?.aiFeedback
    ? submission.aiFeedback.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*]\s*/, ''))
    : []

  return (
    <div className="p-7 max-w-[900px]">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-[#9591A8] mb-6 flex-wrap">
        <Link href="/assignments" className="text-[#7C5CDB] hover:underline">Assignments</Link>
        <span>›</span>
        <span className="text-[#1A1523]">{course.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div>
          <h1 className="text-[22px] font-black text-[#1A1523] tracking-tight mb-2">
            {assignment.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-[#9591A8]">{course.title}</span>
            <span className="text-[#9591A8]">·</span>
            <span className="text-[12px] text-[#9591A8]">{module_.title}</span>
            <span className="text-[#9591A8]">·</span>
            <DifficultyBadge difficulty={course.difficulty} />
          </div>
        </div>

        {dueBadge && (
          <div className={`border rounded-[10px] px-4 py-3 text-center flex-shrink-0 ${dueBadge.bg}`}>
            <div className={`text-[18px] font-black ${dueBadge.textColor}`}>{dueBadge.label}</div>
            <div className={`text-[11px] font-bold ${dueBadge.subColor}`}>{dueBadge.sub}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">

          {/* Instructions card */}
          <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
            <h2 className="text-[15px] font-bold text-[#1A1523] mb-4">Assignment Instructions</h2>

            <div className="mb-4">
              {renderDescription(assignment.description)}
            </div>

            {requirements.length > 0 && (
              <>
                <h3 className="text-[13px] font-bold text-[#1A1523] mb-3">Requirements</h3>
                <div className="flex flex-col gap-2 mb-4">
                  {requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] text-[#1A1523]">
                      <span className="w-5 h-5 rounded-full bg-[#EDE8FF] flex items-center justify-center text-[10px] text-[#7C5CDB] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{req}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {bonusLines.length > 0 && (
              <div className="bg-[#F7F7F9] rounded-lg p-3.5 border-l-[3px] border-[#7C5CDB]">
                <div className="text-[12px] font-bold text-[#7C5CDB] mb-1">Bonus Challenge</div>
                {bonusLines.map((b, i) => (
                  <div key={i} className="text-[13px] text-[#9591A8]">{b}</div>
                ))}
              </div>
            )}
          </div>

          {/* Submission form OR submitted state */}
          {isSubmitted ? (
            <div className="flex flex-col gap-4">
              {/* Submitted confirmation */}
              <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-[11px] font-bold">✓</span>
                  <span className="text-[14px] font-bold text-[#22C55E]">Assignment Submitted</span>
                  <span className="text-[12px] text-[#9591A8] ml-auto">
                    {new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {submission.githubUrl && (
                  <div className="flex items-center gap-2 text-[13px] text-[#1A1523] mb-2">
                    <svg className="w-4 h-4 text-[#9591A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                    <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#7C5CDB] hover:underline truncate">
                      {submission.githubUrl}
                    </a>
                  </div>
                )}
                {submission.liveUrl && (
                  <div className="flex items-center gap-2 text-[13px] text-[#1A1523]">
                    <svg className="w-4 h-4 text-[#9591A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[#7C5CDB] hover:underline truncate">
                      {submission.liveUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* AI Feedback card */}
              {(submission.aiFeedback || aiFeedbackItems.length > 0) && (
                <div className="bg-white border border-[#E9E7EF] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
                  <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#7C5CDB 0%,#6146C4 100%)' }}>
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-[16px]">🤖</div>
                    <div>
                      <div className="text-[14px] font-bold text-white">Codentia AI — Instant Feedback</div>
                      <div className="text-[11px] text-white/70">Reviewed your submission automatically</div>
                    </div>
                    <span className="ml-auto bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      Preliminary · Instructor review pending
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col gap-3">
                      {aiFeedbackItems.length > 0 ? (
                        aiFeedbackItems.map((item, i) => {
                          const isPositive = item.includes('✓') || item.toLowerCase().includes('good') || item.toLowerCase().includes('great') || item.toLowerCase().includes('well') || item.toLowerCase().includes('correct')
                          const isWarning  = item.includes('!') || item.toLowerCase().includes('suggest') || item.toLowerCase().includes('consider') || item.toLowerCase().includes('improve')
                          const bg   = isPositive ? 'bg-[#DCFCE7]' : isWarning ? 'bg-[#FEF3C7]' : 'bg-[#EDE8FF]'
                          const tc   = isPositive ? 'text-[#16A34A]' : isWarning ? 'text-[#D97706]' : 'text-[#7C5CDB]'
                          const icon = isPositive ? '✓' : isWarning ? '!' : '→'
                          return (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className={`w-5 h-5 rounded-full ${bg} flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${tc}`}>{icon}</span>
                              <span className="text-[13px] text-[#1A1523] leading-relaxed">{item}</span>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-[13px] text-[#1A1523] leading-relaxed whitespace-pre-wrap">{submission.aiFeedback}</p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#E9E7EF] text-[12px] text-[#9591A8]">
                      Instructor review typically takes 24–48 hours. You&apos;ll be notified when feedback is ready.
                    </div>
                  </div>
                </div>
              )}

              {/* Instructor feedback */}
              {submission.feedback && (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[14px] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">👩‍🏫</span>
                    <span className="text-[14px] font-bold text-[#1D4ED8]">Instructor Feedback</span>
                    {submission.grade !== null && (
                      <span className="ml-auto bg-[#DBEAFE] text-[#1D4ED8] text-[12px] font-bold px-3 py-0.5 rounded-full">
                        {submission.grade}/100
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#1E40AF] leading-relaxed whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              )}

              {(submission.status === 'PENDING' || submission.status === 'AI_REVIEWED') && !submission.feedback && (
                <p className="text-[13px] text-[#9591A8] text-center py-2">
                  ⏳ Waiting for instructor review...
                </p>
              )}
            </div>
          ) : (
            <AssignmentForm assignmentId={assignmentId} />
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4">

          {/* Details widget */}
          <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="text-[13px] font-bold text-[#1A1523] mb-4">Assignment Details</div>
            <div className="flex flex-col gap-3">
              {/* Status */}
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#9591A8]">Status</span>
                {isSubmitted ? (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    submission.status === 'GRADED' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                    submission.status === 'INSTRUCTOR_REVIEWED' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                    submission.status === 'AI_REVIEWED' ? 'bg-[#EDE8FF] text-[#7C5CDB]' :
                    'bg-[#FEF3C7] text-[#D97706]'
                  }`}>
                    {submission.status === 'GRADED' ? 'Graded' :
                     submission.status === 'INSTRUCTOR_REVIEWED' ? 'Instructor reviewed' :
                     submission.status === 'AI_REVIEWED' ? 'AI reviewed' : 'Pending review'}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 rounded-full">
                    Pending submission
                  </span>
                )}
              </div>

              {/* Due date */}
              {due && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#9591A8]">Due date</span>
                  <span className={`font-bold ${!isSubmitted && due < new Date() ? 'text-[#EF4444]' : 'text-[#1A1523]'}`}>
                    {due < new Date() && !isSubmitted ? 'Overdue · ' : ''}
                    {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              {/* Grade */}
              {submission?.grade !== null && submission?.grade !== undefined && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#9591A8]">Score</span>
                  <span className="font-bold text-[#16A34A]">{submission.grade} / 100</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#9591A8]">Max score</span>
                <span className="font-bold text-[#1A1523]">100 points</span>
              </div>
            </div>
          </div>

          {/* Related lesson */}
          <div className="bg-white border border-[#E9E7EF] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="text-[13px] font-bold text-[#1A1523] mb-3">Related Lesson</div>
            <Link
              href={`/courses/${course.id}/learn/${assignment.lesson.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F7F7F9] transition-colors no-underline"
            >
              <div className="w-7 h-7 rounded-md bg-[#EDE8FF] flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-[#7C5CDB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#1A1523]">{assignment.lesson.title}</div>
                <div className="text-[11px] text-[#9591A8]">{module_.title}</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
