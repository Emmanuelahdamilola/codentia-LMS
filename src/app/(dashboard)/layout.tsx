import { auth }     from '@/auth'
import { prisma }   from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Sidebar      from '@/components/shared/Sidebar'
import TopBar       from '@/components/shared/TopBar'
import { SidebarProvider } from '@/lib/sidebar-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { image: true },
  })

  return (
    <SidebarProvider>
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        {/* Sidebar: fixed on desktop, drawer on mobile via AnimatePresence */}
        <Sidebar role="STUDENT" userName={session.user.name ?? ''} userEmail={session.user.email ?? ''} />
        {/* TopBar: fixed, full-width on mobile, offset by sidebar on lg+ */}
        <TopBar userName={session.user.name ?? ''} userImage={user?.image ?? null} />
        {/* Main content: padded top for topbar, left for sidebar on lg+ */}
        <div
          className="pt-[var(--topbar-height)] lg:ml-[var(--sidebar-width)]"
          style={{ minHeight: '100vh' }}
        >
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}