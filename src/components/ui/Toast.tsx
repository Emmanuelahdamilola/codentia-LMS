// PATH: src/components/ui/Toast.tsx
'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message:   string
  type?:     ToastType
  duration?: number          // ms — default 4000
  onClose:   () => void
}

const styles = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: <CheckCircle size={16} className="text-green-600 shrink-0" /> },
  error:   { bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   icon: <XCircle      size={16} className="text-red-500 shrink-0"   /> },
  info:    { bg: 'bg-[#F0EAFF] border-[#C4B8EE]',text: 'text-[#424040]', icon: <AlertCircle  size={16} className="text-[#8A70D6] shrink-0" /> },
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)
  const { bg, text, icon } = styles[type]

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
      transition-all duration-300 ${bg}
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
    `}>
      {icon}
      <p className={`text-sm font-medium flex-1 ${text}`}>{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        className="p-0.5 rounded hover:opacity-70 transition-opacity ml-1">
        <X size={14} className={text} />
      </button>
    </div>
  )
}

// ─── Toast container + simple hook ───────────────────────────

interface ToastItem { id: string; message: string; type: ToastType }

import { createContext, useContext, useCallback } from 'react'

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
      {/* Fixed toast stack — top-right */}
      <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}