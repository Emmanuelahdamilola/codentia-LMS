// Force all auth pages to be dynamic — never cached by Vercel's CDN.
// Without this, Vercel caches /login and serves stale 304s causing redirect loops.
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}