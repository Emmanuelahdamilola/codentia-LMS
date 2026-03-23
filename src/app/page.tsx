// PATH: src/app/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await auth()

  // Logged-in users go straight to their dashboard
  if (session) {
    redirect(session.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')
  }

  // Guests see the landing page
  redirect('/home')
}