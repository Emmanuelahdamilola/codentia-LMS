'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList,
  CheckSquare, Video, BarChart2, User, Settings,
  LogOut, Code2, CalendarDays, Trophy, Medal, FileText, X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/sidebar-context'

interface NavItem {
  href: string; icon: React.ElementType; label: string
  badge?: number | string; section?: string
}

const studentNav: NavItem[] = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/courses',      icon: BookOpen,        label: 'Courses' },
  { href: '/lessons',      icon: PlayCircle,      label: 'My Learning' },
  { href: '/assignments',  icon: ClipboardList,   label: 'Assignments' },
  { href: '/quizzes',      icon: CheckSquare,     label: 'Quizzes' },
  { href: '/live-classes', icon: Video,           label: 'Live Classes', section: 'Live' },
  { href: '/calendar',     icon: CalendarDays,    label: 'Calendar' },
  { href: '/progress',     icon: BarChart2,       label: 'Progress', section: 'Track' },
  { href: '/leaderboard',  icon: Trophy,          label: 'Leaderboard' },
  { href: '/badges',       icon: Medal,           label: 'Badges' },
  { href: '/resources',    icon: FileText,        label: 'Resources' },
]

const adminNav: NavItem[] = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/courses',      icon: BookOpen,        label: 'Courses' },
  { href: '/admin/lessons',      icon: PlayCircle,      label: 'Lessons' },
  { href: '/admin/quizzes',      icon: CheckSquare,     label: 'Quizzes' },
  { href: '/admin/assignments',  icon: ClipboardList,   label: 'Assignments' },
  { href: '/admin/live-classes', icon: Video,           label: 'Live Classes' },
  { href: '/admin/students',     icon: User,            label: 'Students' },
]

const navItemVariants = {
  hidden:  { opacity: 0, x: -18 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.32, ease: [0.25, 1, 0.5, 1] as any },
  }),
}

interface Props { role?: 'STUDENT' | 'ADMIN'; userName?: string; userEmail?: string }

function NavContent({ role, userName, nav, pathname, onClose }: {
  role: string; userName: string; nav: NavItem[]; pathname: string; onClose: () => void
}) {
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && href !== '/admin/dashboard' && pathname.startsWith(href))

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 shrink-0 justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href={role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
          className="flex items-center gap-2.5 no-underline" onClick={onClose}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 8 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            <Code2 size={14} className="text-white" />
          </motion.div>
          <span className="text-[15px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Code<span style={{ color: '#A48FE0' }}>ntia</span>
          </span>
        </Link>
        {/* Close button — always visible (hidden by parent on desktop) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          className="p-1.5 rounded-lg"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        {nav.map((item, i) => {
          const { href, icon: Icon, label, badge, section } = item
          const active = isActive(href)
          return (
            <motion.div
              key={`${href}-${label}`}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              {section && (
                <p className="text-[9.5px] font-semibold uppercase tracking-[1.2px] px-3 pt-4 pb-1.5"
                  style={{ color: 'rgba(255,255,255,0.22)' }}>{section}</p>
              )}
              <Link href={href} onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-[8.5px] rounded-[10px] mb-0.5 text-[13px] font-medium no-underline"
                style={{
                  color: active ? '#fff' : 'rgba(255,255,255,0.52)',
                  background: active ? 'var(--color-sidebar-active)' : 'transparent',
                  boxShadow: active ? '0 2px 8px rgba(124,92,219,0.35)' : 'none',
                  transition: 'all 0.15s cubic-bezier(0.25,1,0.5,1)',
                }}
                onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.85)' }}}
                onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.color = 'rgba(255,255,255,0.52)' }}}
              >
                <Icon size={15} className="shrink-0" style={{ opacity: active ? 1 : 0.75 }} />
                <span className="flex-1">{label}</span>
                {badge !== undefined && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{ background: active ? 'rgba(255,255,255,0.2)' : '#DC2626', color: '#fff' }}>
                    {badge}
                  </span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2.5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { href: role === 'ADMIN' ? '/admin/profile' : '/profile', icon: User, label: 'Profile' },
          { href: role === 'ADMIN' ? '/admin/settings' : '/settings', icon: Settings, label: 'Settings' },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-[8.5px] rounded-[10px] mb-0.5 text-[13px] font-medium no-underline"
              style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', background: active ? 'var(--color-sidebar-active)' : 'transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.85)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = active ? 'var(--color-sidebar-active)' : 'transparent'; el.style.color = active ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              <Icon size={15} /><span>{label}</span>
            </Link>
          )
        })}
        <motion.button
          whileHover={{ backgroundColor: 'rgba(220,38,38,0.12)', color: '#F87171' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2.5 px-3 py-[8.5px] rounded-[10px] text-[13px] w-full text-left font-medium"
          style={{ color: 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
        >
          <LogOut size={15} /><span>Log out</span>
        </motion.button>
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#7C5CDB,#6146C4)' }}>
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.78)' }}>{userName || 'User'}</div>
            <div className="text-[10.5px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{role === 'ADMIN' ? 'Administrator' : 'Student'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const desktopVariants = {
  hidden:  { x: -24, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] as any } },
}
const drawerVariants = {
  hidden:  { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 34 } },
  exit:    { x: '-100%', transition: { duration: 0.26, ease: [0.4, 0, 1, 1] as any } },
}

export default function Sidebar({ role = 'STUDENT', userName = '' }: Props) {
  const pathname = usePathname()
  const { open, close } = useSidebar()
  const nav = role === 'ADMIN' ? adminNav : studentNav

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        variants={desktopVariants}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex fixed left-0 top-0 h-screen flex-col z-40"
        style={{ width: 'var(--sidebar-width)', background: 'var(--color-sidebar-bg)' }}
      >
        {/* Hide the X on desktop by wrapping NavContent and hiding that button */}
        <div className="flex flex-col h-full [&_button[aria-label='Close sidebar']]:hidden">
          <NavContent role={role} userName={userName} nav={nav} pathname={pathname} onClose={close} />
        </div>
      </motion.aside>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(15,13,26,0.65)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="lg:hidden fixed left-0 top-0 h-screen flex flex-col z-50 overflow-y-auto"
            style={{ width: 'min(280px, 85vw)', background: 'var(--color-sidebar-bg)' }}
          >
            <NavContent role={role} userName={userName} nav={nav} pathname={pathname} onClose={close} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}