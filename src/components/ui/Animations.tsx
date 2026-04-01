// PATH: src/components/ui/Animations.tsx
// Lightweight animation wrappers — no dependencies required

import { HTMLAttributes } from 'react'

/** Fades and slides up on mount. Stagger children with delay prop. */
export function FadeUp({
  children,
  delay = 0,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms`, ...((props as any).style ?? {}) }}
      {...props}
    >
      {children}
    </div>
  )
}

/** Stagger-wraps children, applying progressive animation delays */
export function StaggerList({
  children,
  baseDelay = 0,
  step = 40,
  className = '',
}: {
  children: React.ReactNode[]
  baseDelay?: number
  step?: number
  className?: string
}) {
  return (
    <>
      {children.map((child, i) => (
        <div
          key={i}
          className={`animate-fade-up ${className}`}
          style={{ animationDelay: `${baseDelay + i * step}ms` }}
        >
          {child}
        </div>
      ))}
    </>
  )
}

/** Full-page skeleton loader for content areas */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="px-7 py-6 space-y-4 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>
      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="skeleton h-10 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton rounded-xl" style={{ height: 52, opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  )
}

/** Premium empty state with optional CTA */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon:          React.ReactNode
  title:         string
  description?:  string
  action?:       React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-up">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--color-primary-tint)' }}>
        <span className="text-[var(--color-primary)]">{icon}</span>
      </div>
      <h3 className="text-[15px] font-semibold text-[#1A1523] mb-1.5">{title}</h3>
      {description && (
        <p className="text-[13px] text-[#9591A8] max-w-[280px] leading-relaxed mb-5">{description}</p>
      )}
      {action && action}
    </div>
  )
}
