'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean; onClose: () => void
  title?: string; subtitle?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

const widths = { sm: '420px', md: '560px', lg: '720px', xl: '900px' }

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

const panelVariants = {
  hidden:  { opacity: 0, scale: 0.93, y: 20 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0, scale: 0.94, y: 16,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
}

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="absolute inset-0"
            style={{ background: 'rgba(15,13,26,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl w-full flex flex-col overflow-hidden"
            style={{
              maxWidth: widths[maxWidth],
              maxHeight: '90vh',
              boxShadow: '0 40px 100px rgba(15,13,26,0.28), 0 8px 24px rgba(15,13,26,0.1)',
              border: '1px solid rgba(233,231,239,0.8)',
            }}
          >
            {/* Subtle top shimmer */}
            <div
              className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-2xl pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(124,92,219,0.5),transparent)' }}
            />

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E9E7EF' }}>
                <div>
                  {title && <h3 className="font-semibold text-[#1A1523] text-[15px]" style={{ letterSpacing: '-0.01em' }}>{title}</h3>}
                  {subtitle && <p className="text-[12.5px] text-[#9591A8] mt-0.5">{subtitle}</p>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.12, backgroundColor: '#F4F1FF', color: '#7C5CDB' }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg ml-4 shrink-0"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9591A8' }}
                >
                  <X size={15} />
                </motion.button>
              </div>
            )}
            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 shrink-0 flex items-center justify-end gap-3 rounded-b-2xl"
                style={{ borderTop: '1px solid #E9E7EF', background: '#F7F7F9' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
