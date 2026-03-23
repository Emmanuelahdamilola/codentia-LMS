'use client'

/**
 * hooks/useCourses.ts
 * Lightweight client-side hook for fetching course data.
 * Used in components that need dynamic course data without full page reloads.
 */

import { useState, useEffect } from 'react'

interface CourseSummary {
  id: string
  title: string
  slug: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  category: string | null
  published: boolean
  _count: { enrollments: number }
}

interface EnrolledCourse extends CourseSummary {
  progress: number // 0-100
}

export function useCourses() {
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => setCourses(data))
      .catch(() => setError('Failed to load courses'))
      .finally(() => setIsLoading(false))
  }, [])

  return { courses, isLoading, error }
}

export function useEnrolledCourses() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/courses/enrolled')
      .then(r => r.json())
      .then(data => setCourses(data))
      .catch(() => setError('Failed to load enrolled courses'))
      .finally(() => setIsLoading(false))
  }, [])

  return { courses, isLoading, error }
}