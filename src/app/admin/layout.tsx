// PATH: src/app/admin/layout.tsx
import { auth }     from '@/auth'
import { prisma }   from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminShell   from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session)                      redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  // Fetch current image from DB (session doesn't carry it after update)
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { image: true },
  })

  return (
    <AdminShell
      adminName={session.user.name   ?? 'Admin'}
      adminEmail={session.user.email ?? ''}
      adminImage={user?.image        ?? null}
    >
      {children}
    </AdminShell>
  )
}