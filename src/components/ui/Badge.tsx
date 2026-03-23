// PATH: src/components/ui/Badge.tsx

interface BadgeProps {
  children: React.ReactNode
  variant?: 'purple' | 'green' | 'amber' | 'red' | 'blue' | 'gray'
  className?: string
}

const variants = {
  purple: 'bg-[#E9E3FF] text-[#6B52B8]',
  green:  'bg-green-100 text-green-700',
  amber:  'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
}

export default function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full
      text-xs font-semibold ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  )
}

// Convenience exports for difficulty badges
export function DifficultyBadge({ difficulty }: { difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }) {
  const map = {
    BEGINNER:     { label: 'Beginner',     variant: 'green'  },
    INTERMEDIATE: { label: 'Intermediate', variant: 'amber'  },
    ADVANCED:     { label: 'Advanced',     variant: 'red'    },
  } as const
  const { label, variant } = map[difficulty]
  return <Badge variant={variant}>{label}</Badge>
}

// Submission status badge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PENDING:             { label: 'Pending',             variant: 'amber'  },
    AI_REVIEWED:         { label: 'AI Reviewed',         variant: 'purple' },
    INSTRUCTOR_REVIEWED: { label: 'Instructor Reviewed', variant: 'blue'   },
    GRADED:              { label: 'Graded',              variant: 'green'  },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}