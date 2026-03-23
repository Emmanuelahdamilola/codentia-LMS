// PATH: src/components/dashboard/EnrollButton.tsx
'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseId:   string
  priceUsd:   number | null   // null or 0 = free
  enrolled:   boolean
  published:  boolean
}

export default function EnrollButton({ courseId, priceUsd, enrolled, published }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const router = useRouter()

  const isFree = !priceUsd || priceUsd === 0
  const label  = enrolled      ? 'Continue Learning'
               : isFree        ? 'Enrol Free'
               : `Enrol · $${priceUsd?.toFixed(2)}`

  async function handleClick() {
    if (enrolled) { router.push(`/courses/${courseId}/learn`); return }
    if (!published) return

    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courseId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Enrolment failed')

      if (data.free) {
        // Free course — refresh to show enrolled state
        router.refresh()
      } else if (data.url) {
        // Paid — redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        disabled={loading || !published}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px"
        style={{ background: enrolled ? '#22C55E' : '#8A70D6' }}
        onMouseEnter={e => {
          if (!loading && published)
            e.currentTarget.style.background = enrolled ? '#16A34A' : '#6B52B8'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = enrolled ? '#22C55E' : '#8A70D6'
        }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {isFree || enrolled ? 'Loading…' : 'Redirecting to payment…'}
          </>
        ) : (
          <>
            {enrolled && (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
            {!isFree && !enrolled && (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            )}
            {label}
          </>
        )}
      </button>

      {error && (
        <p className="text-[12px] text-[#EF4444] text-center font-medium">{error}</p>
      )}

      {!isFree && !enrolled && (
        <p className="text-[11px] text-[#8A8888] text-center">
          Secure payment via Stripe · Instant access
        </p>
      )}
    </div>
  )
}