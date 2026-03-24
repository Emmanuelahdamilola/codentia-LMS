// Uses getToken() instead of auth() to avoid importing Prisma in Edge Runtime.
import { getToken }                      from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Public routes — no auth needed ────────────────────────
  const publicPrefixes = [
    '/login', '/register',
    '/home',
    '/verify-email',
    '/api/paystack/webhook',
    '/api/cron',
    '/icon.svg', '/apple-icon.svg', '/favicon.ico',
  ]
  if (publicPrefixes.some(p => pathname.startsWith(p))) {
    const secret = process.env.NEXTAUTH_SECRET
    if (secret && (pathname === '/login' || pathname === '/register')) {
      const token = await getToken({ req, secret })
      if (token) {
        const role = token.role as string | undefined
        return NextResponse.redirect(
          new URL(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', req.url)
        )
      }
    }
    return NextResponse.next()
  }

  // ── Root — handled by src/app/page.tsx ────────────────────
  if (pathname === '/') return NextResponse.next()

  // ── Require NEXTAUTH_SECRET ────────────────────────────────
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[middleware] NEXTAUTH_SECRET is not set')
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const token      = await getToken({ req, secret })
  const isLoggedIn = !!token
  const role       = token?.role as string | undefined

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