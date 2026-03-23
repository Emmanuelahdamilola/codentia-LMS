/**
 * constants/index.ts
 * App-wide constants for Codentia.
 * Import specific groups to keep bundle size minimal.
 */

// ─── App metadata ─────────────────────────────────────────────

export const APP_NAME = 'Codentia'
export const APP_TAGLINE = 'Learn. Build. Get Hired.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Auth ─────────────────────────────────────────────────────

export const AUTH_ROUTES = {
  LOGIN:    '/login',
  REGISTER: '/register',
} as const

export const PROTECTED_ROUTES = {
  STUDENT_HOME: '/dashboard',
  ADMIN_HOME:   '/admin/dashboard',
} as const

// ─── Roles ────────────────────────────────────────────────────

export const ROLES = {
  STUDENT: 'STUDENT',
  ADMIN:   'ADMIN',
} as const

// ─── Progress ─────────────────────────────────────────────────

/** Quiz score below this threshold triggers AI study recommendations */
export const AI_RECOMMENDATION_THRESHOLD = 60 // percent

/** Minimum quiz score to be considered "passed" */
export const QUIZ_PASS_THRESHOLD = 60 // percent

// ─── AI ───────────────────────────────────────────────────────

export const AI_MODELS = {
  DEFAULT:  'gpt-4o',
  FALLBACK: 'gpt-4o-mini',
} as const

export const AI_MAX_TOKENS = {
  TUTOR:       800,
  FEEDBACK:    500,
  QUIZ_GEN:    2000,
  RECOMMEND:   300,
} as const

// ─── Live classes ─────────────────────────────────────────────

/** Reminder windows in minutes before a live class */
export const REMINDER_WINDOWS = {
  H24:   24 * 60, // 1440 min
  H1:    60,
  MIN10: 10,
} as const

export const CLASS_DURATION_OPTIONS = [30, 45, 60, 90, 120] // minutes

// ─── Pagination ───────────────────────────────────────────────

export const PAGE_SIZE = {
  COURSES:     12,
  STUDENTS:    20,
  SUBMISSIONS: 15,
  ACTIVITY:    10,
} as const

// ─── File uploads ─────────────────────────────────────────────

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB:  50,
  ALLOWED_VIDEO:     ['mp4', 'webm', 'mov'],
  ALLOWED_DOCS:      ['pdf', 'docx', 'pptx', 'zip'],
  ALLOWED_IMAGE:     ['jpg', 'jpeg', 'png', 'webp', 'gif'],
} as const

// ─── UI ───────────────────────────────────────────────────────

export const DIFFICULTY_LABELS = {
  BEGINNER:     'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED:     'Advanced',
} as const

export const DIFFICULTY_COLORS = {
  BEGINNER:     { bg: 'bg-green-100',  text: 'text-green-700'  },
  INTERMEDIATE: { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  ADVANCED:     { bg: 'bg-red-100',    text: 'text-red-700'    },
} as const

export const SUBMISSION_STATUS_LABELS = {
  PENDING:              'Pending',
  AI_REVIEWED:          'AI Reviewed',
  INSTRUCTOR_REVIEWED:  'Instructor Reviewed',
  GRADED:               'Graded',
} as const

export const SUBMISSION_STATUS_COLORS = {
  PENDING:              { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  AI_REVIEWED:          { bg: 'bg-purple-100', text: 'text-purple-700' },
  INSTRUCTOR_REVIEWED:  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  GRADED:               { bg: 'bg-green-100',  text: 'text-green-700'  },
} as const

export const NOTIFICATION_ICONS = {
  NEW_LESSON:           '📚',
  ASSIGNMENT_FEEDBACK:  '📝',
  QUIZ_RESULT:          '🏆',
  LIVE_CLASS_REMINDER:  '📹',
  ASSIGNMENT_DEADLINE:  '⏰',
} as const