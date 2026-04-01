import { auth }     from '@/auth'
import { prisma }   from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminShell   from '@/components/admin/AdminShell'
import { SidebarProvider } from '@/lib/sidebar-context'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session)                      redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { image: true },
  })

  return (
    <SidebarProvider>
      <AdminShell
        adminName={session.user.name   ?? 'Admin'}
        adminEmail={session.user.email ?? ''}
        adminImage={user?.image        ?? null}
      >
        {children}
      </AdminShell>
    </SidebarProvider>
  )
}