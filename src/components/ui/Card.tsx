'use client'
import { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
  delay?:     number
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-7' }

const cardVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] as any, delay },
  }),
}

export default function Card({ hoverable = false, padding = 'md', children, className = '', delay = 0, ...props }: CardProps) {
  return (
    <motion.div
      custom={delay}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverable ? {
        y: -4,
        scale: 1.006,
        boxShadow: '0 16px 40px rgba(15,13,26,0.12), 0 4px 12px rgba(15,13,26,0.06)',
        transition: { type: 'spring', stiffness: 400, damping: 28 },
      } : undefined}
      className={`bg-white rounded-2xl border border-[#E9E7EF] ${paddings[padding]} ${className}`}
      style={{
        boxShadow: '0 2px 8px rgba(15,13,26,0.06)',
        cursor: hoverable ? 'pointer' : undefined,
        ...((props as any).style || {}),
      }}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}

const statCardVariants = {
  hidden:  { opacity: 0, y: 22 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as any, delay },
  }),
}

export function StatCard({ label, value, icon, trend, color = 'bg-[#EDE8FF] text-[#7C5CDB]', delay = 0 }:
  { label: string; value: string | number; icon: React.ReactNode; trend?: { value: string; up: boolean }; color?: string; delay?: number }) {
  return (
    <motion.div
      custom={delay}
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -5,
        boxShadow: '0 16px 40px rgba(124,92,219,0.16), 0 4px 12px rgba(15,13,26,0.06)',
        transition: { type: 'spring', stiffness: 380, damping: 26 },
      }}
      className="bg-white rounded-2xl border border-[#E9E7EF] p-5 flex items-start gap-4 relative overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)', cursor: 'default' }}
    >
      {/* top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg,#7C5CDB,#A48FE0,transparent)' }} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[26px] font-bold text-[#1A1523] leading-none" style={{ letterSpacing: '-0.03em' }}>{value}</p>
        <p className="text-[12.5px] text-[#9591A8] font-medium mt-1">{label}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1.5 text-[11.5px] font-semibold ${trend.up ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            <span>{trend.up ? '↑' : '↓'}</span>{trend.value}
          </div>
        )}
      </div>
    </motion.div>
  )
}
