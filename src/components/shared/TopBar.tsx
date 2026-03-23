// PATH: src/components/shared/TopBar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import NotificationBell from '@/components/shared/NotificationBell'

interface TopBarProps {
  userName?:  string
  userImage?: string | null
}

export default function TopBar({ userName = '', userImage }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="fixed top-0 left-[240px] right-0 h-[60px] bg-white border-b border-[#EBEBEB] flex items-center px-6 gap-4 z-30">
      {/* Search */}
      <div className="flex items-center gap-2 bg-[#FBFBFB] border border-[#EBEBEB] rounded-lg px-3 h-9 flex-1 max-w-[400px]">
        <Search size={14} className="text-[#8A8888] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search courses, lessons, assignments..."
          className="border-none bg-transparent outline-none font-[Lato,sans-serif] text-[13px] text-[#424040] w-full placeholder:text-[#8A8888]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />

        {/* Avatar / dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#E9E3FF] transition-colors"
          >
            {userImage ? (
              <img src={userImage} alt={userName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8A70D6] to-[#6B52B8] flex items-center justify-center font-bold text-[13px] text-white">
                {initials}
              </div>
            )}
            <ChevronDown size={14} className="text-[#8A8888]" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-[#EBEBEB] shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#EBEBEB]">
                  <p className="text-sm font-semibold text-[#424040] truncate">{userName}</p>
                </div>
                <div className="py-1">
                  <Link href="/profile" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#424040] hover:bg-[#F8F6FF] transition-colors">
                    <User size={15} /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#424040] hover:bg-[#F8F6FF] transition-colors">
                    <Settings size={15} /> Settings
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}