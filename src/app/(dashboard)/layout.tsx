// PATH: src/app/(dashboard)/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/shared/Sidebar'
import TopBar from '@/components/shared/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <Sidebar
        role="STUDENT"
        userName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
      />
      {/* Offset for fixed sidebar + fixed topbar */}
      <div className="ml-[240px] pt-[60px] flex">
        <TopBar
          userName={session.user.name ?? ''}
          userImage={session.user.image}
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}