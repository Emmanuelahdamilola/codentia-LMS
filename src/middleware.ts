// PATH: src/middleware.ts
// Uses getToken() instead of auth() to avoid importing Prisma in Edge Runtime.
// auth() wraps auth.ts which imports PrismaClient — incompatible with the Edge Runtime.

import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    // Secret not set — fail open in dev, redirect to login in prod
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    console.error('[middleware] NEXTAUTH_SECRET is not set in .env.local')
    return NextResponse.next()
  }

  // Read JWT token (works in Edge Runtime — no Prisma needed)
  const token = await getToken({ req, secret })

  const isLoggedIn = !!token
  const role       = token?.role as string | undefined

  // ── Public routes ──────────────────────────────────────────
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', req.url)
      )
    }
    return NextResponse.next()
  }

  // ── Not logged in → login ──────────────────────────────────
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin-only routes ──────────────────────────────────────
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // ── Student routes — redirect admin to their panel ─────────
  const studentPrefixes = [
    '/dashboard', '/courses', '/assignments', '/quizzes',
    '/live-classes', '/progress', '/profile', '/settings',
    '/leaderboard', '/badges', '/calendar', '/lessons',
  ]
  if (studentPrefixes.some(p => pathname.startsWith(p)) && role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}