'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, CheckCheck, BookOpen, Trophy, Video, ClipboardList, Clock } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string; type: string; title: string
  message: string; read: boolean; link: string | null; createdAt: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  NEW_LESSON:          <BookOpen      size={14} className="text-[#7C5CDB]" />,
  QUIZ_RESULT:         <Trophy        size={14} className="text-amber-500"  />,
  LIVE_CLASS_REMINDER: <Video         size={14} className="text-blue-500"   />,
  ASSIGNMENT_FEEDBACK: <ClipboardList size={14} className="text-emerald-500"/>,
  ASSIGNMENT_DEADLINE: <Clock         size={14} className="text-red-500"    />,
}

const TYPE_BG: Record<string, string> = {
  NEW_LESSON:          'bg-[#EAE4FF]',
  QUIZ_RESULT:         'bg-amber-50',
  LIVE_CLASS_REMINDER: 'bg-blue-50',
  ASSIGNMENT_FEEDBACK: 'bg-emerald-50',
  ASSIGNMENT_DEADLINE: 'bg-red-50',
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
    if (document.hidden) return
    setLoading(true)
    try {
      const res  = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  useEffect(() => { fetchNotifications() }, [fetchNotifications])
  useEffect(() => {
    const t = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [fetchNotifications])
  useEffect(() => {
    function h() { if (!document.hidden) fetchNotifications() }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [fetchNotifications])
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-xl hover:bg-[#EAE4FF] hover:text-[#7C5CDB] transition-colors text-[#9591A8]"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#7C5CDB] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_0_2px_white]"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl z-50 overflow-hidden border border-[#E9E7EF]"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E9E7EF]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#1A1523] text-sm">Notifications</h3>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold bg-[#EAE4FF] text-[#7C5CDB] px-1.5 py-0.5 rounded-full border border-[rgba(124,92,219,0.2)]">
                      {unread} new
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-[#7C5CDB] font-semibold hover:opacity-70 transition-opacity"
                  >
                    <CheckCheck size={12}/> Mark all read
                  </motion.button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="flex flex-col gap-2.5 p-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex gap-3">
                        <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-3 rounded w-3/4" />
                          <div className="skeleton h-2.5 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-10 h-10 rounded-2xl bg-[#EAE4FF] flex items-center justify-center mx-auto mb-2.5">
                      <Bell size={18} className="text-[#7C5CDB]" />
                    </div>
                    <p className="text-xs text-[#9591A8] font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex gap-3 px-4 py-3 border-b border-[#E9E7EF] last:border-0 transition-colors duration-150 ${!n.read ? 'bg-[#F8F6FF] hover:bg-[#F0EAFF]' : 'hover:bg-[#F7F6FB]'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${TYPE_BG[n.type] ?? 'bg-[#EAE4FF]'}`}>
                        {TYPE_ICONS[n.type] ?? <Bell size={14} className="text-[#7C5CDB]"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A1523] truncate">{n.title}</p>
                        <p className="text-[11px] text-[#9591A8] mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-[#C0BCCD]">{timeAgo(n.createdAt)}</span>
                          {n.link && (
                            <Link href={n.link} onClick={() => setOpen(false)}
                              className="text-[10px] text-[#7C5CDB] font-semibold hover:underline">View →</Link>
                          )}
                        </div>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-[#7C5CDB] rounded-full shrink-0 mt-2 shadow-[0_0_0_3px_rgba(124,92,219,0.15)]" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}