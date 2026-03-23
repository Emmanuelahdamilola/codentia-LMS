// PATH: src/components/dashboard/LessonNotes.tsx
'use client'

import { useState, useEffect } from 'react'

interface Props {
  lessonId: string
}

const STORAGE_KEY = (id: string) => `lesson_notes_${id}`

export default function LessonNotes({ lessonId }: Props) {
  const [notes, setNotes]   = useState('')
  const [saved, setSaved]   = useState(false)

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(lessonId))
    if (stored) setNotes(stored)
  }, [lessonId])

  function saveNotes() {
    localStorage.setItem(STORAGE_KEY(lessonId), notes)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden flex flex-col flex-1"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3.5 py-3 border-b border-[#EBEBEB]">
        <svg className="w-3.5 h-3.5 text-[#424040]" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span className="text-[13px] font-bold text-[#424040]">My Notes</span>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder={`Take notes for this lesson...\n\nKey points, questions, ideas...`}
        className="flex-1 resize-none border-none outline-none px-3.5 py-3 text-[12.5px] leading-relaxed text-[#424040] bg-[#FBFBFB] placeholder:text-[#8A8888] min-h-[140px]"
      />

      {/* Footer */}
      <div className="px-3.5 py-2 border-t border-[#EBEBEB] flex justify-end">
        <button
          onClick={saveNotes}
          className="text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: saved ? '#DCFCE7' : '#E9E3FF',
            color:      saved ? '#16A34A' : '#8A70D6',
          }}
        >
          {saved ? '✓ Saved' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}