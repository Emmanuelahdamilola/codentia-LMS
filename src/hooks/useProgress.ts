'use client'

/**
 * hooks/useProgress.ts
 * Tracks lesson completion state on the client.
 * Used by MarkCompleteButton and lesson navigation.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseProgressOptions {
  lessonId: string
  initialCompleted?: boolean
  nextLessonId?: string
  onComplete?: () => void
}

export function useProgress({
  lessonId,
  initialCompleted = false,
  nextLessonId,
  onComplete,
}: UseProgressOptions) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const markComplete = useCallback(async () => {
    if (isCompleted || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })

      if (!res.ok) throw new Error('Failed to mark lesson complete')

      setIsCompleted(true)
      onComplete?.()
      router.refresh()

      if (nextLessonId) {
        setTimeout(() => {
          router.push(`/courses/${nextLessonId}`) // will be overridden by caller if needed
        }, 600)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [lessonId, isCompleted, isLoading, nextLessonId, onComplete, router])

  return { isCompleted, isLoading, error, markComplete }
}