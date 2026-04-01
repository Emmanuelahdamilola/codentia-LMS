// PATH: src/components/dashboard/EnrollButton.tsx
'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'

const USD_TO_NGN = Number(process.env.NEXT_PUBLIC_USD_TO_NGN_RATE ?? 1600)

interface Props {
  courseId:  string
  priceUsd:  number | null   // null or 0 = free
  enrolled:  boolean
  published: boolean
}

export default function EnrollButton({ courseId, priceUsd, enrolled, published }: Props) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const router = useRouter()

  const isFree   = !priceUsd || priceUsd === 0
  const priceNgn = priceUsd ? priceUsd * USD_TO_NGN : 0

  const displayPrice = currency === 'NGN'
    ? `₦${priceNgn.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${priceUsd?.toFixed(2)}`

  const label = enrolled  ? 'Continue Learning'
              : isFree    ? 'Enrol Free'
              : `Enrol · ${displayPrice}`

  async function handleClick() {
    if (enrolled)  { router.push(`/courses/${courseId}/learn`); return }
    if (!published) return

    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/paystack/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courseId, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Enrolment failed')

      if (data.free) {
        router.refresh()
      } else if (data.url) {
        // Redirect to Paystack checkout page
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Currency toggle — only show for paid courses not yet enrolled */}
      {!isFree && !enrolled && (
        <div className="flex rounded-lg overflow-hidden border border-[#E9E7EF]" style={{ height: 32 }}>
          {(['NGN', 'USD'] as const).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className="flex-1 text-[12px] font-bold transition-all"
              style={{
                background: currency === c ? '#7C5CDB' : '#F7F7F9',
                color:      currency === c ? '#fff'    : '#9591A8',
                border:     'none',
              }}
            >
              {c === 'NGN' ? '₦ NGN' : '$ USD'}
            </button>
          ))}
        </div>
      )}

      {/* Enrol button */}
      <button
        onClick={handleClick}
        disabled={loading || !published}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: enrolled ? '#16A34A' : '#7C5CDB' }}
        onMouseEnter={e => {
          if (!loading && published)
            e.currentTarget.style.background = enrolled ? '#16A34A' : '#6146C4'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = enrolled ? '#16A34A' : '#7C5CDB'
        }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Redirecting to Paystack…
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
        <p className="text-[12px] text-[#DC2626] text-center font-medium">{error}</p>
      )}

      {!isFree && !enrolled && (
        <p className="text-[11px] text-[#9591A8] text-center">
          Secure payment via Paystack · Cards, bank transfer & USSD
        </p>
      )}
    </div>
  )
}