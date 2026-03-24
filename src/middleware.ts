// Uses getToken() instead of auth() to avoid importing Prisma in Edge Runtime.
import { getToken }                      from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

// In production (HTTPS) NextAuth uses the __Secure- prefixed cookie name.
// We must pass cookieName explicitly so getToken() finds the right cookie
// regardless of environment.
function getTokenOptions(req: NextRequest) {
  const secure = req.url.startsWith('https://')
  return {
    req,
    secret:     process.env.NEXTAUTH_SECRET!,
    cookieName: secure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
  }
}

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
    if (pathname === '/login' || pathname === '/register') {
      const secret = process.env.NEXTAUTH_SECRET
      if (secret) {
        const token = await getToken(getTokenOptions(req))
        if (token) {
          const role = token.role as string | undefined
          return NextResponse.redirect(
            new URL(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', req.url)
          )
        }
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

  const token      = await getToken(getTokenOptions(req))
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