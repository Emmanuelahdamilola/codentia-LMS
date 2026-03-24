import { Role, Difficulty, SubmissionStatus, LiveClassStatus } from '@prisma/client'

// ─── Auth ────────────────────────────────────────────────────

declare module 'next-auth' {
  interface User {
    role: Role
  }
  interface Session {
    user: {
      id:     string
      name:   string
      email:  string
      image?: string | null
      role:   Role
    }
  }
}

// ─── Course with relations ───────────────────────────────────

export type CourseWithModules = {
  id: string
  title: string
  description: string
  thumbnail: string | null
  difficulty: Difficulty
  category: string | null
  published: boolean
  modules: ModuleWithLessons[]
  _count?: { enrollments: number }
}

export type ModuleWithLessons = {
  id: string
  title: string
  order: number
  lessons: LessonSummary[]
}

export type LessonSummary = {
  id: string
  title: string
  order: number
  videoUrl: string | null
  hasQuiz: boolean
  hasAssignment: boolean
}

// ─── Progress ────────────────────────────────────────────────

export type CourseProgress = {
  courseId: string
  courseTitle: string
  totalLessons: number
  completedLessons: number
  percentage: number
}

// ─── Dashboard stats ─────────────────────────────────────────

export type StudentStats = {
  totalCoursesEnrolled: number
  totalLessonsCompleted: number
  totalQuizzesPassed: number
  totalAssignmentsSubmitted: number
  currentStreak: number
}

export type AdminStats = {
  totalStudents: number
  totalCourses: number
  pendingSubmissions: number
  liveClassesThisWeek: number
}

// ─── API response helpers ─────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Re-export Prisma enums for use in components
export { Role, Difficulty, SubmissionStatus, LiveClassStatus }