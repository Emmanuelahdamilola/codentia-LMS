'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/sidebar-context'
import { Menu, X } from 'lucide-react'
import AvatarUpload from '@/components/ui/AvatarUpload'

const NAV = [
  { section: 'Overview', items: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></> },
    { label: 'Analytics',  href: '/admin/analytics',  icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
  ]},
  { section: 'Content', items: [
    { label: 'Courses',      href: '/admin/courses',      icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></> },
    { label: 'Lessons',      href: '/admin/lessons',      icon: <><polygon points="5 3 19 12 5 21 5 3"/></> },
    { label: 'Quizzes',      href: '/admin/quizzes',      icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Live Classes', href: '/admin/live-classes', icon: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
  ]},
  { section: 'People', items: [
    { label: 'Students', href: '/admin/students', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
  ]},
  { section: 'Manage', items: [
    { label: 'Assignments',   href: '/admin/assignments',   icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> },
    { label: 'Notifications', href: '/admin/notifications', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
  ]},
  { section: 'System', items: [
    { label: 'Settings',   href: '/admin/settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
    { label: 'My Profile', href: '/admin/profile',  icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
  ]},
]

const BREADCRUMBS: Record<string, string> = {
  '/admin/dashboard': 'Dashboard', '/admin/analytics': 'Analytics',
  '/admin/courses': 'Courses', '/admin/lessons': 'Lessons',
  '/admin/quizzes': 'Quizzes', '/admin/live-classes': 'Live Classes',
  '/admin/students': 'Students', '/admin/assignments': 'Assignments',
  '/admin/notifications': 'Notifications', '/admin/settings': 'Settings',
  '/admin/profile': 'My Profile',
}

interface Props { adminName: string; adminEmail: string; adminImage?: string | null; children: React.ReactNode }

function SidebarContent({ adminName, adminImage, pathname, onClose }: {
  adminName: string; adminImage: string | null; pathname: string; onClose: () => void
}) {
  const initials = adminName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const [image, setImage] = useState<string | null>(adminImage)

  async function handleImageUpload(url: string) {
    setImage(url)
    await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: adminName, image: url }),
    })
  }

  let navIdx = 0

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </motion.div>
          <span className="text-[15px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Code<span style={{ color: '#A48FE0' }}>ntia</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(124,92,219,0.2)', color: '#A48FE0', border: '1px solid rgba(124,92,219,0.25)' }}>
            ADMIN
          </span>
        </div>
        <button onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 pt-3 pb-2 overflow-y-auto">
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-1">
            <div className="text-[9.5px] font-semibold uppercase tracking-[1.2px] px-3 py-1.5"
              style={{ color: 'rgba(255,255,255,0.22)' }}>
              {section}
            </div>
            {items.map((item: any) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const idx = navIdx++
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, delay: idx * 0.04 }}
                >
                  <Link href={item.href} onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-[8.5px] rounded-[10px] mb-0.5 text-[13px] font-medium no-underline"
                    style={{
                      color: active ? '#fff' : 'rgba(255,255,255,0.52)',
                      background: active ? 'var(--color-sidebar-active)' : 'transparent',
                      boxShadow: active ? '0 2px 8px rgba(124,92,219,0.35)' : 'none',
                      transition: 'all 0.15s cubic-bezier(0.25,1,0.5,1)',
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.85)' }}}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.52)' }}}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ width: 14, height: 14, flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                      {item.icon}
                    </svg>
                    {item.label}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2.5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] as any, delay: 0.5 }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <AvatarUpload currentImage={image} initials={initials} size={28} onUpload={handleImageUpload} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.78)' }}>{adminName}</div>
            <div className="text-[10.5px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>Super Admin</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(220,38,38,0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, stroke: 'rgba(255,255,255,0.38)' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

const drawerVariants = {
  hidden:  { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 34 } },
  exit:    { x: '-100%', transition: { duration: 0.26, ease: [0.4, 0, 1, 1] as any } },
}

export default function AdminShell({ adminName, adminEmail, adminImage, children }: Props) {
  const pathname = usePathname()
  const page = BREADCRUMBS[pathname] ?? 'Admin'
  const [searchFocused, setSearchFocused] = useState(false)
  const { open: sidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="hidden lg:flex flex-shrink-0 flex-col overflow-y-auto z-40"
        style={{ width: 230, background: 'var(--color-sidebar-bg)' }}
      >
        <SidebarContent adminName={adminName} adminImage={adminImage ?? null} pathname={pathname} onClose={closeSidebar} />
      </motion.aside>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(15,13,26,0.65)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="lg:hidden fixed left-0 top-0 h-screen flex flex-col z-50 overflow-y-auto"
            style={{ width: 'min(280px, 85vw)', background: 'var(--color-sidebar-bg)' }}
          >
            <SidebarContent adminName={adminName} adminImage={adminImage ?? null} pathname={pathname} onClose={closeSidebar} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <motion.header
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28, delay: 0.1 }}
          className="flex-shrink-0 flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 w-full"
          style={{
            height: 56, borderBottom: '1px solid #E9E7EF',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)', zIndex: 10,
          }}
        >
          {/* Mobile hamburger */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#F4F1FF' }} whileTap={{ scale: 0.92 }}
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ background: 'transparent', border: '1px solid #E9E7EF', cursor: 'pointer' }}
            aria-label="Toggle sidebar"
          >
            <Menu size={17} style={{ color: '#5A5672' }} />
          </motion.button>

          {/* Logo mobile */}
          <span className="lg:hidden text-[15px] font-bold text-[#1A1523]" style={{ letterSpacing: '-0.02em' }}>
            Code<span style={{ color: '#7C5CDB' }}>ntia</span>
          </span>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-[13px]">
            <span className="font-medium" style={{ color: '#9591A8' }}>Admin</span>
            <span style={{ color: '#C4C0D4', fontSize: 11 }}>›</span>
            <span className="font-semibold" style={{ color: '#1A1523' }}>{page}</span>
          </div>
          <span className="sm:hidden text-[13px] font-semibold" style={{ color: '#1A1523' }}>{page}</span>

          {/* Search */}
          <motion.div
            animate={{
              borderColor: searchFocused ? '#7C5CDB' : '#E9E7EF',
              boxShadow: searchFocused ? '0 0 0 3px rgba(124,92,219,0.12)' : '0 0 0 0px transparent',
            }}
            transition={{ duration: 0.18 }}
            className="ml-auto hidden md:flex items-center gap-2 rounded-xl px-3"
            style={{ height: 34, width: 220, background: '#F7F7F9', border: '1.5px solid #E9E7EF' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#9591A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Search..." onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              className="flex-1 border-none bg-transparent outline-none text-[13px]"
              style={{ color: '#1A1523', fontFamily: 'var(--font-sans)' }} />
          </motion.div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:ml-2 ml-auto">
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className="relative flex items-center justify-center rounded-xl"
              style={{ width: 34, height: 34, border: '1px solid #E9E7EF', background: '#fff', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#9591A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            </motion.button>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/admin/courses"
                className="hidden sm:flex items-center gap-1.5 px-3.5 font-semibold text-[12.5px] text-white rounded-xl no-underline"
                style={{
                  height: 34, background: 'var(--color-primary)',
                  boxShadow: '0 1px 2px rgba(124,92,219,0.25),inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-primary-dark)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-primary)'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 12, height: 12 }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Course
              </Link>
            </motion.div>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}