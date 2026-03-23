// PATH: src/components/admin/AdminShell.tsx
'use client'

import Link        from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Nav definition (mirrors blueprint exactly) ───────────────
const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
      { label: 'Analytics',  href: '/admin/analytics', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Courses',      href: '/admin/courses',      icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></> },
      { label: 'Live Classes', href: '/admin/live-classes', badge: 1, icon: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Students', href: '/admin/students', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
    ],
  },
  {
    section: 'Management',
    items: [
      { label: 'Assignments',    href: '/admin/assignments',    badge: 34, badgeColor: '#EF4444', icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> },
      { label: 'Notifications',  href: '/admin/notifications',  icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
    ],
  },
]

const BREADCRUMBS: Record<string, string> = {
  '/admin/dashboard':    'Dashboard',
  '/admin/analytics':    'Analytics',
  '/admin/courses':      'Courses',
  '/admin/live-classes': 'Live Classes',
  '/admin/students':     'Students',
  '/admin/assignments':  'Assignments',
  '/admin/notifications':'Notifications',
  '/admin/settings':     'Settings',
  '/admin/lessons':      'Lessons',
  '/admin/quizzes':      'Quizzes',
}

interface Props { adminName: string; adminEmail: string; children: React.ReactNode }

export default function AdminShell({ adminName, adminEmail, children }: Props) {
  const pathname = usePathname()
  const initials = adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const page     = BREADCRUMBS[pathname] ?? 'Admin'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F4F6' }}>

      {/* ── Dark sidebar ──────────────────────────────────── */}
      <aside className="flex-shrink-0 flex flex-col overflow-y-auto z-20"
        style={{ width: 220, background: '#1A1730' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-[18px] pt-[18px] pb-[14px]"
          style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="w-[30px] h-[30px] rounded-lg bg-[#8A70D6] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span className="text-[16px] font-black text-white tracking-tight">
            Code<span style={{ color: '#A48FE0' }}>ntia</span>
          </span>
          <span className="ml-auto text-[9px] font-bold tracking-[.6px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(138,112,214,.25)', color: '#A48FE0', border: '1px solid rgba(138,112,214,.3)' }}>
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 pt-2.5">
          {NAV.map(({ section, items }) => (
            <div key={section} className="mb-1">
              <div className="text-[9px] font-bold uppercase tracking-[.9px] px-2 py-1.5"
                style={{ color: 'rgba(255,255,255,.25)' }}>
                {section}
              </div>
              {items.map((item: any) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-[13px] font-bold transition-all duration-150 no-underline"
                    style={{ color: active ? '#fff' : 'rgba(255,255,255,.5)', background: active ? '#8A70D6' : 'transparent' }}
                    onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
                    onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ width: 15, height: 15, flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                      {item.icon}
                    </svg>
                    {item.label}
                    {item.badge ? (
                      <span className="ml-auto min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1"
                        style={{ background: item.badgeColor ?? '#EF4444' }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Admin profile footer */}
        <div className="px-2.5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div className="w-[30px] h-[30px] rounded-full bg-[#8A70D6] flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold truncate" style={{ color: 'rgba(255,255,255,.8)' }}>{adminName}</div>
              <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,.35)' }}>Admin · Super User</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 13, height: 13, stroke: 'rgba(255,255,255,.3)', flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center px-6 gap-3 bg-white z-10"
          style={{ height: 56, borderBottom: '1px solid #E8E8EC' }}>
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="font-bold" style={{ color: '#8A8888' }}>Admin</span>
            <span style={{ color: '#BCBBBB' }}>›</span>
            <span className="font-black" style={{ color: '#424040' }}>{page}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 rounded-lg"
            style={{ background: '#F4F4F6', border: '1px solid #E8E8EC', height: 34, width: 240 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#8A8888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Search students, courses..." className="flex-1 border-none bg-transparent outline-none text-[13px]" style={{ color: '#424040' }} />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 34, height: 34, border: '1px solid #E8E8EC', background: '#fff' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#8A8888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            </button>
            <button className="flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 34, height: 34, border: '1px solid #E8E8EC', background: '#fff' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#8A8888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
            <Link href="/admin/courses"
              className="flex items-center gap-1.5 px-3.5 font-bold text-[12px] text-white rounded-lg transition-colors hover:bg-[#6B52B8] no-underline"
              style={{ height: 34, background: '#8A70D6' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Course
            </Link>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
