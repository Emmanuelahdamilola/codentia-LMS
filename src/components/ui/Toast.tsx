// PATH: src/components/ui/Toast.tsx
'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message:   string
  type?:     ToastType
  duration?: number
  onClose:   () => void
}

const config = {
  success: {
    icon: CheckCircle2,
    bg:   'bg-white border border-[#BBF7D0]',
    icon_color: 'text-[#16A34A]',
    bar:  'bg-[#16A34A]',
    text: 'text-[#1A1523]',
  },
  error: {
    icon: XCircle,
    bg:   'bg-white border border-[#FECACA]',
    icon_color: 'text-[#DC2626]',
    bar:  'bg-[#DC2626]',
    text: 'text-[#1A1523]',
  },
  warning: {
    icon: AlertCircle,
    bg:   'bg-white border border-[#FDE68A]',
    icon_color: 'text-[#D97706]',
    bar:  'bg-[#D97706]',
    text: 'text-[#1A1523]',
  },
  info: {
    icon: Info,
    bg:   'bg-white border border-[#BFDBFE]',
    icon_color: 'text-[#2563EB]',
    bar:  'bg-[#7C5CDB]',
    text: 'text-[#1A1523]',
  },
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter')
  const { icon: Icon, bg, icon_color, bar, text } = config[type]

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('idle'), 10)
    const idleTimer  = setTimeout(() => setPhase('exit'),  duration)
    const closeTimer = setTimeout(() => onClose(),        duration + 300)
    return () => { clearTimeout(enterTimer); clearTimeout(idleTimer); clearTimeout(closeTimer) }
  }, [duration, onClose])

  function dismiss() {
    setPhase('exit')
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`
        relative flex items-start gap-3 pr-10 pl-4 py-3.5 rounded-2xl overflow-hidden
        shadow-[0_8px_24px_rgba(15,13,26,0.10),0_2px_8px_rgba(15,13,26,0.06)]
        transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${bg}
        ${phase === 'enter' ? 'opacity-0 translate-y-2 scale-95' : ''}
        ${phase === 'idle'  ? 'opacity-100 translate-y-0 scale-100' : ''}
        ${phase === 'exit'  ? 'opacity-0 translate-y-1 scale-95' : ''}
      `}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${bar} rounded-full`}
        style={{
          animation: phase === 'idle' ? `progressFill ${duration}ms linear reverse both` : 'none',
          width: phase === 'idle' ? '0%' : '100%',
        }}
      />

      <Icon size={16} className={`shrink-0 mt-0.5 ${icon_color}`} />
      <p className={`text-sm font-medium flex-1 leading-snug ${text}`}>{message}</p>
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 p-0.5 rounded-md text-[#9591A8] hover:text-[#1A1523] hover:bg-[#F7F7F9] transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}

interface ToastItem { id: string; message: string; type: ToastType }

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  function remove(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2.5 w-[340px]">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() { return useContext(ToastContext) }
