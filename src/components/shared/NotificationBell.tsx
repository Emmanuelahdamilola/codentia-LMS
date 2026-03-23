'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, CheckCheck, BookOpen, Trophy, Video, ClipboardList, Clock } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id:        string
  type:      string
  title:     string
  message:   string
  read:      boolean
  link:      string | null
  createdAt: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  NEW_LESSON:          <BookOpen     size={14} className="text-[#8A70D6]" />,
  QUIZ_RESULT:         <Trophy       size={14} className="text-amber-500" />,
  LIVE_CLASS_REMINDER: <Video        size={14} className="text-blue-500"  />,
  ASSIGNMENT_FEEDBACK: <ClipboardList size={14} className="text-green-500" />,
  ASSIGNMENT_DEADLINE: <Clock        size={14} className="text-red-500"   />,
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread,        setUnread]        = useState(0)
  const [loading,       setLoading]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    // Don't fetch if tab is hidden — saves Neon connections
    if (document.hidden) return
    setLoading(true)
    try {
      const res  = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch {
      // Silently fail — don't crash the UI for notification errors
    } finally {
      setLoading(false)
    }
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  // Fetch on mount
  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Poll every 5 MINUTES (not 60s) — Neon free tier has only 5 connections
  // Pause polling when tab is hidden to save connections
  useEffect(() => {
    const FIVE_MINUTES = 5 * 60 * 1000
    const t = setInterval(fetchNotifications, FIVE_MINUTES)
    return () => clearInterval(t)
  }, [fetchNotifications])

  // Re-fetch when tab becomes visible again
  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) fetchNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-lg hover:bg-[#E9E3FF] transition-colors"
      >
        <Bell size={20} className="text-[#8A8888]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#8A70D6] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#E8E4F0] shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4F0]">
              <h3 className="font-bold text-[#424040] text-sm">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[#8A70D6] font-semibold hover:underline">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8A8888]">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell size={28} className="text-[#E9E3FF] mx-auto mb-2" />
                  <p className="text-xs text-[#8A8888]">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-[#E8E4F0] last:border-0 hover:bg-[#F8F6FF] transition-colors ${!n.read ? 'bg-[#F8F6FF]' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E9E3FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] ?? <Bell size={14} className="text-[#8A70D6]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#424040] truncate">{n.title}</p>
                      <p className="text-[11px] text-[#8A8888] mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[#B0ADAD]">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <Link href={n.link} onClick={() => setOpen(false)}
                            className="text-[10px] text-[#8A70D6] font-semibold hover:underline">
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-[#8A70D6] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}