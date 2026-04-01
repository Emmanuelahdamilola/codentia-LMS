'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationBell from '@/components/shared/NotificationBell'
import { useSidebar } from '@/lib/sidebar-context'

interface Props { userName?: string; userImage?: string | null }

const dropdownVariants = {
  hidden:  { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 28 } },
  exit:    { opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as any } },
}

export default function TopBar({ userName = '', userImage }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const { toggle } = useSidebar()
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-30 flex items-center px-3 sm:px-4 gap-2 sm:gap-3"
      style={{
        height: 'var(--topbar-height)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #E9E7EF',
      }}
    >
      {/* Hamburger — always visible on mobile/tablet */}
      <motion.button
        whileHover={{ scale: 1.06, backgroundColor: '#F4F1FF' }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        onClick={toggle}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
        style={{ background: 'transparent', border: '1px solid #E9E7EF', cursor: 'pointer' }}
        aria-label="Toggle sidebar"
      >
        <Menu size={17} style={{ color: '#5A5672' }} />
      </motion.button>

      {/* Logo — mobile only */}
      <Link href="/dashboard" className="lg:hidden flex items-center gap-2 no-underline shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <span className="text-[15px] font-bold text-[#1A1523]" style={{ letterSpacing: '-0.02em' }}>
          Code<span style={{ color: '#7C5CDB' }}>ntia</span>
        </span>
      </Link>

      {/* Search */}
      <motion.div
        animate={{
          borderColor: searchFocused ? '#7C5CDB' : '#E9E7EF',
          boxShadow: searchFocused ? '0 0 0 3px rgba(124,92,219,0.15)' : '0 0 0 0px transparent',
        }}
        transition={{ duration: 0.18 }}
        className="hidden sm:flex items-center gap-2 rounded-xl px-3 h-9 flex-1"
        style={{
          maxWidth: 360, background: '#F7F7F9',
          border: '1.5px solid #E9E7EF',
        }}
      >
        <Search size={13} style={{ color: '#9591A8', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search anything..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="border-none bg-transparent outline-none w-full text-[13px]"
          style={{ color: '#1A1523', fontFamily: 'var(--font-sans)' }}
        />
        <span className="hidden md:flex items-center gap-0.5 shrink-0 text-[10.5px] font-medium" style={{ color: '#C4C0D4' }}>⌘K</span>
      </motion.div>

      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        <NotificationBell />
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 480, damping: 28 }}
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 py-1.5 rounded-xl"
            style={{
              background: dropdownOpen ? '#EDE8FF' : 'transparent',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s',
            }}
          >
            {userImage
              ? <img src={userImage} alt={userName} className="w-8 h-8 rounded-lg object-cover" style={{ boxShadow: '0 0 0 2px #E9E7EF' }} />
              : <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-[12px] text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C5CDB,#4F38A8)' }}>{initials || '?'}</div>
            }
            <span className="hidden sm:block text-[13px] font-medium max-w-[90px] truncate" style={{ color: '#5A5672' }}>{userName}</span>
            <motion.div
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            >
              <ChevronDown size={13} style={{ color: '#9591A8' }} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  key="dropdown"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl z-50 overflow-hidden"
                  style={{
                    boxShadow: '0 12px 40px rgba(15,13,26,0.14), 0 2px 8px rgba(15,13,26,0.06)',
                    border: '1px solid #E9E7EF',
                  }}
                >
                  <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #F0EEF7' }}>
                    <p className="text-[13px] font-semibold text-[#1A1523] truncate">{userName}</p>
                    <p className="text-[11.5px] text-[#9591A8] mt-0.5">Student account</p>
                  </div>
                  <div className="py-1.5 px-1.5">
                    {[{ href: '/profile', icon: User, label: 'Profile' }, { href: '/settings', icon: Settings, label: 'Settings' }].map(({ href, icon: Icon, label }) => (
                      <Link key={href} href={href} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium no-underline"
                        style={{ color: '#5A5672', transition: 'all 0.12s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#F4F1FF'; el.style.color = '#7C5CDB' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.color = '#5A5672' }}>
                        <Icon size={14} />{label}
                      </Link>
                    ))}
                    <div className="my-1.5 mx-1" style={{ borderTop: '1px solid #F0EEF7' }} />
                    <button onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-[#DC2626] font-medium"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                      <LogOut size={14} />Log out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}