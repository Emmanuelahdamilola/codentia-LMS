// PATH: src/components/dashboard/LessonSidebarClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

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
  courseTitle,
  moduleTitle,
  courseProgress,
  modules,
  completedLessonIds,
  currentLessonId,
  courseId,
}: Props) {
  const completedSet = new Set(completedLessonIds)

  // Open the module that contains the current lesson by default
  const defaultOpen = modules.reduce<Record<string, boolean>>((acc, mod) => {
    const hasCurrent = mod.lessons.some(l => l.id === currentLessonId)
    acc[mod.id] = hasCurrent
    return acc
  }, {})

  const [openModules, setOpenModules] = useState<Record<string, boolean>>(defaultOpen)

  function toggleModule(id: string) {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white border-r border-[#EBEBEB] overflow-y-auto sticky top-[60px] h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#EBEBEB]">
        <div className="text-[11px] font-bold uppercase tracking-[.8px] text-[#8A70D6] mb-0.5">
          {courseTitle}
        </div>
        <div className="text-[14px] font-bold text-[#424040] truncate">{moduleTitle}</div>
        <div className="mt-2.5">
          <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8A70D6] rounded-full transition-all duration-700"
              style={{ width: `${courseProgress.pct}%` }}
            />
          </div>
          <div className="text-[11px] text-[#8A8888] mt-1">
            {courseProgress.pct}% complete · {courseProgress.done} of {courseProgress.total} lessons
          </div>
        </div>
      </div>

      {/* Modules */}
      {modules.map(mod => {
        const isOpen     = !!openModules[mod.id]
        const doneInMod  = mod.lessons.filter(l => completedSet.has(l.id)).length
        const totalInMod = mod.lessons.length
        const allDone    = doneInMod === totalInMod && totalInMod > 0

        return (
          <div key={mod.id} className="border-b border-[#EBEBEB]">
            {/* Module header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FBFBFB] transition-colors text-left"
            >
              <div>
                <div className="text-[12px] font-bold text-[#424040]">{mod.title}</div>
                <div className="text-[11px] text-[#8A8888] mt-0.5">
                  {allDone
                    ? `${totalInMod}/${totalInMod} complete`
                    : doneInMod > 0
                      ? `${doneInMod}/${totalInMod} in progress`
                      : `${totalInMod} lessons`}
                </div>
              </div>
              <svg
                className="flex-shrink-0 text-[#8A8888] transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', width: 14, height: 14 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Lesson list */}
            {isOpen && (
              <div>
                {mod.lessons.map(lesson => {
                  const isDone    = completedSet.has(lesson.id)
                  const isCurrent = lesson.id === currentLessonId

                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${courseId}/learn/${lesson.id}`}
                      className={`flex items-center gap-2.5 py-[9px] pr-4 pl-6 border-l-[3px] transition-all duration-150 no-underline
                        ${isCurrent
                          ? 'bg-[#E9E3FF] border-l-[#8A70D6]'
                          : 'border-l-transparent hover:bg-[#FBFBFB]'
                        }`}
                    >
                      {/* Status indicator */}
                      <span
                        className={`w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[9px]
                          ${isDone
                            ? 'bg-[#8A70D6] text-white'
                            : isCurrent
                              ? 'border-2 border-[#8A70D6] bg-[#E9E3FF]'
                              : 'border-2 border-[#EBEBEB] bg-[#FBFBFB]'
                          }`}
                      >
                        {isDone && (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>

                      {/* Title */}
                      <span className={`flex-1 text-[12.5px] truncate
                        ${isCurrent ? 'text-[#8A70D6] font-bold' : isDone ? 'text-[#8A8888]' : 'text-[#424040]'}`}>
                        {lesson.title}
                      </span>

                      {/* Badge for quiz/assignment */}
                      {lesson.hasQuiz && (
                        <span className="text-[9px] font-bold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Quiz
                        </span>
                      )}
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