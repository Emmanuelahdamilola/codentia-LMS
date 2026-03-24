// Uses getToken() instead of auth() to avoid importing Prisma in Edge Runtime.
import { getToken }                     from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

// ── Helpers ────────────────────────────────────────────────────────────────
function absoluteUrl(path: string, req: NextRequest): URL {
  // Always build redirects from NEXTAUTH_URL so they never point at localhost
  // in production. Falls back to the incoming request origin when the env var
  // is absent (e.g. local dev without the variable set).
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
  return new URL(path, base)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Public routes — no auth check needed ──────────────────────────────────
  const publicPrefixes = [
    '/home',                  // marketing landing page
    '/verify-email',          // email verification (must stay public!)
    '/api/paystack/webhook',  // Paystack server-to-server webhook
    '/api/cron',              // cron.org calls (protected by CRON_SECRET)
    '/icon.svg', '/apple-icon.svg', '/favicon.ico',
  ]
  if (publicPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Root — let page.tsx handle the redirect ────────────────────────────────
  if (pathname === '/') return NextResponse.next()

  // ── Resolve secret (required for all token checks below) ──────────────────
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[middleware] NEXTAUTH_SECRET is not set')
    return NextResponse.redirect(absoluteUrl('/login', req))
  }

  const token      = await getToken({ req, secret })
  const isLoggedIn = !!token
  const role       = token?.role as string | undefined

  // ── /login and /register — redirect authenticated users away ───────────────
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isLoggedIn) {
      // Honour the callbackUrl if it is safe (same origin), otherwise fall back
      // to the role-appropriate dashboard.
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
      const safeCallback =
        callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : null

      const destination =
        safeCallback ?? (role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')

      return NextResponse.redirect(absoluteUrl(destination, req))
    }
    return NextResponse.next()
  }

  // ── Everything below this line is a protected route ───────────────────────

  // Not logged in → send to login
  if (!isLoggedIn) {
    const loginUrl = absoluteUrl('/login', req)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Email not verified → verification page
  // Only block when emailVerified is *explicitly* null (freshly registered).
  // undefined means the token predates this field — let the user through.
  const emailVerified = token?.emailVerified
  if (emailVerified === null) {
    return NextResponse.redirect(absoluteUrl('/verify-email', req))
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(absoluteUrl('/dashboard', req))
  }

  // Student routes — send admins to their own panel
  const studentPrefixes = [
    '/dashboard', '/courses', '/assignments', '/quizzes',
    '/live-classes', '/progress', '/profile', '/settings',
    '/leaderboard', '/badges', '/calendar', '/lessons',
  ]
  if (studentPrefixes.some(p => pathname.startsWith(p)) && role === 'ADMIN') {
    return NextResponse.redirect(absoluteUrl('/admin/dashboard', req))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}