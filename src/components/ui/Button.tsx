'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion, type MotionProps } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?:    'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantMap = {
  primary:   { bg: '#7C5CDB', color: '#fff',       border: 'none',                 shadow: '0 1px 2px rgba(124,92,219,0.25),inset 0 1px 0 rgba(255,255,255,0.12)' },
  secondary: { bg: '#fff',    color: '#5A5672',     border: '1.5px solid #E9E7EF', shadow: '0 1px 2px rgba(15,13,26,0.04)' },
  ghost:     { bg: 'transparent', color: '#7C5CDB', border: 'none',                shadow: 'none' },
  danger:    { bg: '#DC2626', color: '#fff',        border: 'none',                shadow: '0 1px 2px rgba(220,38,38,0.25)' },
  success:   { bg: '#16A34A', color: '#fff',        border: 'none',                shadow: '0 1px 2px rgba(22,163,74,0.25)' },
}

const sizeMap = {
  xs: { padding: '5px 10px',  fontSize: '11.5px', borderRadius: '7px'  },
  sm: { padding: '6px 12px',  fontSize: '12.5px', borderRadius: '8px'  },
  md: { padding: '9px 16px',  fontSize: '13px',   borderRadius: '10px' },
  lg: { padding: '11px 22px', fontSize: '14.5px', borderRadius: '12px' },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, style, ...props }, ref) => {
    const v = variantMap[variant]
    const s = sizeMap[size]
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref as any}
        disabled={isDisabled}
        whileHover={!isDisabled ? {
          scale: 1.025,
          boxShadow: variant === 'primary'
            ? '0 8px 24px rgba(124,92,219,0.45), 0 2px 6px rgba(124,92,219,0.2)'
            : variant === 'danger'
            ? '0 8px 24px rgba(220,38,38,0.35)'
            : '0 4px 14px rgba(15,13,26,0.12)',
        } : undefined}
        whileTap={!isDisabled ? { scale: 0.955 } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-flex items-center justify-center gap-2 font-semibold select-none cursor-pointer ${className}`}
        style={{
          background: v.bg,
          color: v.color,
          border: v.border,
          boxShadow: v.shadow,
          padding: s.padding,
          fontSize: s.fontSize,
          borderRadius: s.borderRadius,
          opacity: isDisabled ? 0.5 : 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.01em',
          ...style,
        }}
        {...(props as MotionProps)}
      >
        {loading && (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
            style={{ width: 14, height: 14 }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path style={{ opacity: 0.85 }} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </motion.svg>
        )}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'
export default Button
