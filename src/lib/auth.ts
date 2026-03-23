// PATH: src/lib/auth.ts
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

// ─── Server Component helpers ─────────────────────────────────

/** Returns session or redirects to /login. Use in Server Components. */
export async function requireAuth() {
  const session = await auth()
  if (!session) redirect('/login')
  return session
}

/** Returns session if ADMIN, otherwise redirects. */
export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== Role.ADMIN) redirect('/dashboard')
  return session
}

/** Returns session if STUDENT, otherwise redirects. */
export async function requireStudent() {
  const session = await requireAuth()
  if (session.user.role !== Role.STUDENT) redirect('/admin/dashboard')
  return session
}

/** Returns userId or throws — for API routes. */
export async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')
  return session.user.id
}

/** Returns session or null — no redirect. For optional auth. */
export async function getOptionalSession() {
  return auth()
}

// ─── Role checks ──────────────────────────────────────────────

export function isAdmin(role: Role) { return role === Role.ADMIN }
export function isStudent(role: Role) { return role === Role.STUDENT }

// ─── API route guard ──────────────────────────────────────────

/**
 * Use at top of API route handlers.
 * @example
 * const { userId } = await apiAuth()
 * const { userId } = await apiAuth(Role.ADMIN)  // admin-only
 */
export async function apiAuth(requireRole?: Role) {
  const session = await auth()
  if (!session?.user?.id) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  if (requireRole && session.user.role !== requireRole) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return { session, userId: session.user.id }
}