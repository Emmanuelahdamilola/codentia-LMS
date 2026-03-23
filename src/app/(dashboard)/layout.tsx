// PATH: src/app/(dashboard)/layout.tsx
import { auth }     from '@/auth'
import { prisma }   from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Sidebar      from '@/components/shared/Sidebar'
import TopBar       from '@/components/shared/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  // Fetch latest image from DB — session JWT doesn't update after upload
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { image: true },
  })

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <Sidebar
        role="STUDENT"
        userName={session.user.name   ?? ''}
        userEmail={session.user.email ?? ''}
      />
      <div className="ml-[240px] pt-[60px] flex">
        <TopBar
          userName={session.user.name ?? ''}
          userImage={user?.image ?? null}
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}