// Uses getToken() instead of auth() to avoid importing Prisma in Edge Runtime.
import { getToken }                    from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    console.error('[middleware] NEXTAUTH_SECRET is not set in .env.local')
    return NextResponse.next()
  }

  const token      = await getToken({ req, secret })
  const isLoggedIn = !!token
  const role       = token?.role as string | undefined

  // ── Public routes — no auth needed ────────────────────────
  const publicPrefixes = [
    '/login', '/register',
    '/home',                 // marketing landing page
    '/verify-email',         // email verification
    '/api/paystack/webhook', // Paystack webhook (server-to-server)
    '/api/cron',             // cron.org calls (protected by CRON_SECRET)
    '/icon.svg', '/apple-icon.svg', '/favicon.ico',
  ]
  if (publicPrefixes.some(p => pathname.startsWith(p))) {
    // Already logged in — redirect away from login/register
    if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(
        new URL(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', req.url)
      )
    }
    return NextResponse.next()
  }

  // ── Root — handled by src/app/page.tsx ────────────────────
  if (pathname === '/') return NextResponse.next()

  // ── Not logged in → login ──────────────────────────────────
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Email not verified → verification page ─────────────────
  // Only block if emailVerified is explicitly null (unverified)
  // undefined/missing means token predates this check — let them through
  const emailVerified = token?.emailVerified
  if (emailVerified === null && !pathname.startsWith('/verify-email')) {
    return NextResponse.redirect(new URL('/verify-email', req.url))
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