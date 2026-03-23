// PATH: src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary:   'bg-[#8A70D6] text-white hover:bg-[#6B52B8] disabled:opacity-50',
  secondary: 'border border-[#8A70D6] text-[#8A70D6] hover:bg-[#E9E3FF] disabled:opacity-50',
  ghost:     'text-[#8A70D6] hover:bg-[#E9E3FF] disabled:opacity-50',
  danger:    'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold
          active:scale-[0.98] transition-all duration-150 cursor-pointer
          disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button