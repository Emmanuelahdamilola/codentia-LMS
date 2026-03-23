// PATH: src/app/api/notifications/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — fetch latest 20 notifications
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    20,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

// PATCH — mark all as read
export async function PATCH() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data:  { read: true },
  })

  return NextResponse.json({ success: true })
}

// DELETE — mark single notification read by id (passed in body)
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.notification.update({
    where: { id },
    data:  { read: true },
  })

  return NextResponse.json({ success: true })
}
