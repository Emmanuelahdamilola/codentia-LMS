// PATH: src/components/ui/Card.tsx
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export default function Card({
  hoverable = false,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-[#E8E4F0]
        ${paddings[padding]}
        ${hoverable
          ? 'hover:shadow-md hover:border-[#C4B8EE] transition-all duration-200 cursor-pointer'
          : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// Stat card variant
export function StatCard({
  label,
  value,
  icon,
  color = 'bg-[#E9E3FF] text-[#8A70D6]',
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-[#424040]">{value}</p>
        <p className="text-xs text-[#8A8888] mt-0.5">{label}</p>
      </div>
    </Card>
  )
}