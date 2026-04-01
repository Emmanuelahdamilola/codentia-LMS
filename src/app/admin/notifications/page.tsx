// PATH: src/app/admin/notifications/page.tsx
import { prisma }  from '@/lib/prisma'
import type { Metadata } from 'next'
import AdminNotificationsClient from '@/components/admin/AdminNotificationsClient'

export const metadata: Metadata = { title: 'Notifications — Admin' }

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take:    50,
    include: { user: { select: { name: true, email: true } } },
  })

  const rows = notifications.map(n => ({
    id:        n.id,
    type:      n.type,
    title:     n.title,
    message:   n.message,
    read:      n.read,
    link:      n.link,
    createdAt: n.createdAt.toISOString(),
    userName:  n.user.name,
    userEmail: n.user.email,
  }))

  const unreadCount = notifications.filter(n => !n.read).length

  return <AdminNotificationsClient notifications={rows} unreadCount={unreadCount} />
}