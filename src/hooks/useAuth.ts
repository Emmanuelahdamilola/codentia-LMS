'use client'

/**
 * hooks/useAuth.ts
 * Client-side hook for accessing the current session and user.
 * Wraps next-auth/react useSession with Codentia-specific helpers.
 */

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const user = session?.user ?? null
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isAdmin = user?.role === Role.ADMIN
  const isStudent = user?.role === Role.STUDENT

  function logout() {
    signOut({ callbackUrl: '/login' })
  }

  function requireLogin() {
    if (!isAuthenticated && !isLoading) {
      router.push('/login')
    }
  }

  return {
    user,
    session,
    status,
    isLoading,
    isAuthenticated,
    isAdmin,
    isStudent,
    logout,
    requireLogin,
    refreshSession: update,
    signIn,
  }
}