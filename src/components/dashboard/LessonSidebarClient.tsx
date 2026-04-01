// PATH: src/components/dashboard/LessonSidebarClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, BookOpen, ClipboardList, HelpCircle } from 'lucide-react'

interface LessonItem {
  id:            string
  title:         string
  order:         number
  hasQuiz:       boolean
  hasAssignment: boolean
}

interface ModuleItem {
  id:      string
  title:   string
  order:   number
  lessons: LessonItem[]
}

interface CourseProgress {
  total: number
  done:  number
  pct:   number
}

interface Props {
  courseTitle:          string
  moduleTitle:          string
  courseProgress:       CourseProgress
  modules:              ModuleItem[]
  completedLessonIds:   string[]
  currentLessonId:      string
  courseId:             string
}

export default function LessonSidebarClient({
  courseTitle, moduleTitle, courseProgress,
  modules, completedLessonIds, currentLessonId, courseId,
}: Props) {
  const completedSet = new Set(completedLessonIds)
  const defaultOpen  = modules.reduce<Record<string, boolean>>((acc, mod) => {
    acc[mod.id] = mod.lessons.some(l => l.id === currentLessonId)
    return acc
  }, {})
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(defaultOpen)
  const toggleModule = (id: string) => setOpenModules(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside className="hidden lg:block w-[272px] flex-shrink-0 bg-white border-r border-[#E9E7EF] overflow-y-auto sticky top-[56px] h-[calc(100vh-56px)]">

      {/* Progress header */}
      <div className="px-4 py-4 border-b border-[#E9E7EF]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-tint)' }}>
            <BookOpen size={13} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.8px] truncate" style={{ color: 'var(--color-primary)' }}>
              {courseTitle}
            </div>
            <div className="text-[13px] font-semibold text-[#1A1523] truncate leading-tight">{moduleTitle}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-[#9591A8] font-medium">{courseProgress.done} / {courseProgress.total} lessons</span>
            <span className="text-[11.5px] font-bold" style={{ color: 'var(--color-primary)' }}>{courseProgress.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${courseProgress.pct}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))' }}
            />
          </div>
        </div>
      </div>

      {/* Modules */}
      {modules.map((mod, modIdx) => {
        const isOpen     = !!openModules[mod.id]
        const doneInMod  = mod.lessons.filter(l => completedSet.has(l.id)).length
        const totalInMod = mod.lessons.length
        const allDone    = doneInMod === totalInMod && totalInMod > 0

        return (
          <div key={mod.id} className="border-b border-[#E9E7EF]">
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-150 hover:bg-[#FAF8FF]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-bold shrink-0
                  ${allDone ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F0EEF7] text-[#9591A8]'}`}>
                  {allDone ? '✓' : modIdx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#1A1523] truncate">{mod.title}</div>
                  <div className="text-[11px] text-[#9591A8] mt-0.5">
                    {allDone ? '✓ Complete' : `${doneInMod}/${totalInMod} done`}
                  </div>
                </div>
              </div>
              <ChevronDown
                size={14}
                className="shrink-0 text-[#C4C0D4] transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {isOpen && (
              <div className="pb-1.5">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const done    = completedSet.has(lesson.id)
                  const current = lesson.id === currentLessonId
                  return (
                    <Link key={lesson.id} href={`/lessons/${lesson.id}`}
                      className={`
                        flex items-start gap-2.5 px-4 py-2.5 mx-2 rounded-xl mb-0.5 no-underline
                        transition-all duration-150 group
                        animate-fade-up
                        ${current
                          ? 'bg-[#EDE8FF]'
                          : 'hover:bg-[#F4F1FF]'
                        }
                      `}
                      style={{ animationDelay: `${lessonIdx * 30}ms` }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                        ) : current ? (
                          <div className="w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: 'var(--color-primary)' }}>
                            <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--color-primary)' }} />
                          </div>
                        ) : (
                          <Circle size={15} className="text-[#C4C0D4] group-hover:text-[#9591A8] transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12.5px] leading-snug truncate ${current ? 'font-semibold text-[#4F38A8]' : done ? 'font-medium text-[#5A5672]' : 'font-medium text-[#5A5672]'}`}>
                          {lesson.title}
                        </div>
                        {(lesson.hasQuiz || lesson.hasAssignment) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {lesson.hasQuiz && (
                              <span className="flex items-center gap-0.5 text-[10.5px] font-medium text-[#9591A8]">
                                <HelpCircle size={9} /> Quiz
                              </span>
                            )}
                            {lesson.hasAssignment && (
                              <span className="flex items-center gap-0.5 text-[10.5px] font-medium text-[#9591A8]">
                                <ClipboardList size={9} /> Task
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
