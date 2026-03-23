// PATH: src/components/shared/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList,
  CheckSquare, Video, BarChart2, User, Settings,
  LogOut, Code2, CalendarDays, Download, Trophy, Medal,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: number | string
  badgeVariant?: 'danger' | 'purple'
  section?: string
}

const studentNav: NavItem[] = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'                                    },
  { href: '/courses',      icon: BookOpen,         label: 'Courses'                                     },
  { href: '/lessons',      icon: PlayCircle,       label: 'My Learning', badge: 2, badgeVariant: 'purple' },
  { href: '/assignments',  icon: ClipboardList,    label: 'Assignments', badge: 3, badgeVariant: 'danger' },
  { href: '/quizzes',      icon: CheckSquare,      label: 'Quizzes'                                     },
  { href: '/live-classes', icon: Video,            label: 'Live Classes', badge: 1, badgeVariant: 'danger', section: 'Live' },
  { href: '/calendar',     icon: CalendarDays,     label: 'Calendar'                                    },
  { href: '/progress',     icon: BarChart2,        label: 'Progress',    section: 'Progress'            },
  { href: '/leaderboard',  icon: Trophy,           label: 'Leaderboard'                                 },
  { href: '/badges',       icon: Medal,            label: 'Badges'                                      },
  { href: '/lessons',      icon: Download,         label: 'Resources'                                   },
]

const adminNav: NavItem[] = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/admin/courses',      icon: BookOpen,        label: 'Courses'      },
  { href: '/admin/lessons',      icon: PlayCircle,      label: 'Lessons'      },
  { href: '/admin/quizzes',      icon: CheckSquare,     label: 'Quizzes'      },
  { href: '/admin/assignments',  icon: ClipboardList,   label: 'Assignments'  },
  { href: '/admin/live-classes', icon: Video,           label: 'Live Classes' },
  { href: '/admin/students',     icon: User,            label: 'Students'     },
]

interface SidebarProps {
  role?:      'STUDENT' | 'ADMIN'
  userName?:  string
  userEmail?: string
}

export default function Sidebar({ role = 'STUDENT', userName = '', userEmail = '' }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'ADMIN' ? adminNav : studentNav

  const linkClass = (active: boolean) =>
    `flex items-center gap-[10px] px-3 py-[9px] rounded-md cursor-pointer transition-all duration-200 text-[13.5px] mb-px no-underline ${
      active
        ? 'bg-[#8A70D6] text-white font-bold'
        : 'text-[#8A8888] font-normal hover:bg-[#E9E3FF] hover:text-[#8A70D6]'
    }`

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#EBEBEB] flex flex-col z-40 overflow-y-auto">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-5 border-b border-[#EBEBEB] gap-[10px] flex-shrink-0">
        <Link href={role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
          className="flex items-center gap-[10px] hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8A70D6] to-[#6B52B8] flex items-center justify-center flex-shrink-0">
            <Code2 size={16} className="text-white" />
          </div>
          <span className="text-[18px] font-black text-[#424040] tracking-tight">
            Code<span className="text-[#8A70D6]">ntia</span>
          </span>
        </Link>
        {role === 'ADMIN' && (
          <span className="text-[10px] font-bold text-[#8A70D6] uppercase tracking-widest ml-1">Admin</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-[10px] py-3">
        {navItems.map((item) => {
          const { href, icon: Icon, label, badge, badgeVariant, section } = item
          const isActive = pathname === href ||
            (href !== '/dashboard' && href !== '/admin/dashboard' && pathname.startsWith(href))

          return (
            <div key={`${href}-${label}`}>
              {section && (
                <p className="text-[10px] font-bold tracking-[1px] text-[#B0AEAE] uppercase px-[10px] pt-3 pb-1">
                  {section}
                </p>
              )}
              <Link href={href} className={linkClass(isActive)}>
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge !== undefined && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : badgeVariant === 'purple'
                        ? 'bg-[#E9E3FF] text-[#8A70D6]'
                        : 'bg-[#EF4444] text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-[10px] py-3 border-t border-[#EBEBEB]">
        <Link href="/profile" className={linkClass(pathname === '/profile')}>
          <User size={16} /><span>Profile</span>
        </Link>
        <Link href="/settings" className={linkClass(pathname === '/settings')}>
          <Settings size={16} /><span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-[10px] px-3 py-[9px] rounded-md text-[13.5px] w-full text-left text-[#8A8888] hover:bg-red-50 hover:text-red-500 transition-all duration-200 mt-px"
        >
          <LogOut size={16} /><span>Log out</span>
        </button>
      </div>
    </aside>
  )
}