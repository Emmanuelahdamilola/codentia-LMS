// PATH: src/app/admin/settings/page.tsx
import type { Metadata } from 'next'
import AdminSettingsClient from '@/components/admin/AdminSettingsClient'

export const metadata: Metadata = { title: 'Settings — Admin' }

export default function AdminSettingsPage() {
  return <AdminSettingsClient />
}
