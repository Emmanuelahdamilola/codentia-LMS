// PATH: src/components/ui/Badge.tsx

interface BadgeProps {
  children:  React.ReactNode
  variant?:  'purple' | 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'indigo'
  dot?:      boolean
  className?: string
}

const variants = {
  purple: 'bg-[#EDE8FF] text-[#6146C4] border border-[#D4CAFE]',
  green:  'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]',
  amber:  'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
  red:    'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]',
  blue:   'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]',
  gray:   'bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]',
  indigo: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]',
}

const dotColors: Record<string, string> = {
  purple: 'bg-[#7C5CDB]',
  green:  'bg-[#16A34A]',
  amber:  'bg-[#D97706]',
  red:    'bg-[#DC2626]',
  blue:   'bg-[#2563EB]',
  gray:   'bg-[#71717A]',
  indigo: 'bg-[#4338CA]',
}

export default function Badge({ children, variant = 'gray', dot, className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
      text-[11.5px] font-semibold tracking-[0.01em] leading-none
      ${variants[variant]} ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }) {
  const map = {
    BEGINNER:     { label: 'Beginner',     variant: 'green'  },
    INTERMEDIATE: { label: 'Intermediate', variant: 'amber'  },
    ADVANCED:     { label: 'Advanced',     variant: 'red'    },
  } as const
  const { label, variant } = map[difficulty]
  return <Badge variant={variant} dot>{label}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PENDING:             { label: 'Pending',             variant: 'amber'  },
    AI_REVIEWED:         { label: 'AI Reviewed',         variant: 'purple' },
    INSTRUCTOR_REVIEWED: { label: 'Instructor Reviewed', variant: 'blue'   },
    GRADED:              { label: 'Graded',              variant: 'green'  },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' }
  return <Badge variant={variant} dot>{label}</Badge>
}
