// PATH: src/components/ui/Modal.tsx
'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  subtitle?:  string
  children:   React.ReactNode
  maxWidth?:  'sm' | 'md' | 'lg'
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl w-full ${widths[maxWidth]}
        max-h-[90vh] overflow-y-auto
      `}>
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-5 border-b border-[#E8E4F0]">
            <div>
              {title    && <h3 className="font-bold text-[#424040] text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-[#8A8888] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-4 shrink-0"
            >
              <X size={16} className="text-[#8A8888]" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}