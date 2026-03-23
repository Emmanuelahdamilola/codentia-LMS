// PATH: src/components/dashboard/MarkCompleteButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lessonId:         string
  isCompleted:      boolean
  nextLessonHref?:  string
}

export default function MarkCompleteButton({ lessonId, isCompleted, nextLessonHref }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(isCompleted)
  const router                = useRouter()

  async function handleClick() {
    if (done || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/progress', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lessonId }),
      })
      if (!res.ok) throw new Error('Failed')
      setDone(true)
      router.refresh()
      if (nextLessonHref) {
        setTimeout(() => router.push(nextLessonHref), 500)
      }
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-2 text-[13px] font-bold text-[#22C55E] bg-[#DCFCE7] px-5 py-2.5 rounded-lg">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Completed
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 text-[13px] font-bold text-white px-5 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-60"
      style={{ background: loading ? '#6B52B8' : '#8A70D6' }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = '#6B52B8')}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = '#8A70D6')}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {loading ? 'Saving...' : 'Mark as Complete'}
    </button>
  )
}