/**
 * lib/permissions.ts
 * Fine-grained permission checks for Codentia.
 * All functions are pure (no DB calls) — pass in data you already have.
 */

import { Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────

export type UserPermissions = {
  canCreateCourse: boolean
  canEditCourse: boolean
  canDeleteCourse: boolean
  canPublishCourse: boolean
  canManageLessons: boolean
  canCreateQuiz: boolean
  canUseAIQuizGenerator: boolean
  canGradeSubmissions: boolean
  canScheduleLiveClass: boolean
  canManageStudents: boolean
  canViewAnalytics: boolean
  canEnrollInCourse: boolean
  canSubmitAssignment: boolean
  canTakeQuiz: boolean
  canAccessAITutor: boolean
  canJoinLiveClass: boolean
}

// ─── Permission matrix ────────────────────────────────────────

export function getPermissions(role: Role): UserPermissions {
  const isAdmin = role === Role.ADMIN

  return {
    // Admin-only
    canCreateCourse:        isAdmin,
    canEditCourse:          isAdmin,
    canDeleteCourse:        isAdmin,
    canPublishCourse:       isAdmin,
    canManageLessons:       isAdmin,
    canCreateQuiz:          isAdmin,
    canUseAIQuizGenerator:  isAdmin,
    canGradeSubmissions:    isAdmin,
    canScheduleLiveClass:   isAdmin,
    canManageStudents:      isAdmin,
    canViewAnalytics:       isAdmin,

    // Student-only (admins don't need these)
    canEnrollInCourse:      !isAdmin,
    canSubmitAssignment:    !isAdmin,
    canTakeQuiz:            !isAdmin,

    // Both roles
    canAccessAITutor:       true,
    canJoinLiveClass:       true,
  }
}

// ─── Permission check helpers ─────────────────────────────────

/** Throws if user does not have the requested permission */
export function assertPermission(
  role: Role,
  permission: keyof UserPermissions,
  message?: string
) {
  const perms = getPermissions(role)
  if (!perms[permission]) {
    throw Object.assign(
      new Error(message ?? `Permission denied: ${permission}`),
      { status: 403 }
    )
  }
}

/** Returns true if user has the permission (no throw) */
export function hasPermission(role: Role, permission: keyof UserPermissions): boolean {
  return getPermissions(role)[permission]
}

// ─── Resource ownership checks ────────────────────────────────

/** Can this user view a submission? (owner or admin) */
export function canViewSubmission(
  viewerRole: Role,
  viewerUserId: string,
  submissionUserId: string
): boolean {
  if (viewerRole === Role.ADMIN) return true
  return viewerUserId === submissionUserId
}

/** Can this user modify a course? (admin only) */
export function canModifyCourse(role: Role): boolean {
  return role === Role.ADMIN
}

/** Can this user access a lesson? (must be enrolled OR admin) */
export function canAccessLesson(
  role: Role,
  isEnrolled: boolean
): boolean {
  if (role === Role.ADMIN) return true
  return isEnrolled
}