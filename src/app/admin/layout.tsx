// PATH: src/app/admin/layout.tsx
import { auth }      from '@/auth'
import { redirect }  from 'next/navigation'
import AdminShell    from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session)                      redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <AdminShell
      adminName={session.user.name ?? 'Admin'}
      adminEmail={session.user.email ?? ''}
    >
      {children}
    </AdminShell>
  )
}
