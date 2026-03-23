// PATH: src/app/admin/profile/page.tsx
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import type { Metadata } from 'next'
import AdminProfileClient from '@/components/admin/AdminProfileClient'

export const metadata: Metadata = { title: 'My Profile — Admin' }

export default async function AdminProfilePage() {
  const session = await auth()
  const userId  = session!.user.id

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, name: true, email: true, image: true, bio: true, timezone: true, createdAt: true },
  })

  if (!user) return null

  return (
    <AdminProfileClient
      user={{
        name:        user.name,
        email:       user.email,
        image:       user.image ?? null,
        bio:         user.bio ?? '',
        timezone:    user.timezone ?? 'Africa/Lagos',
        memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        initials:    user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      }}
    />
  )
}