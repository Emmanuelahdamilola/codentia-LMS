// PATH: src/app/(auth)/verify-email/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Status = 'verifying' | 'success' | 'expired' | 'invalid' | 'unverified'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [status,  setStatus]  = useState<Status>(token ? 'verifying' : 'unverified')
  const [email,   setEmail]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/auth/verify-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setStatus('success')
        else if (d.error?.includes('expired')) setStatus('expired')
        else setStatus('invalid')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  useEffect(() => {
    if (status !== 'success') return
    const t = setTimeout(() => router.push('/login?verified=1'), 3000)
    return () => clearTimeout(t)
  }, [status, router])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true); setError('')
    try {
      const res  = await fetch('/api/auth/resend-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally { setSending(false) }
  }

  const resendForm = (
    !sent ? (
      <form onSubmit={handleResend} style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required style={input} />
        {error && <p style={{ color:'#EF4444', fontSize:13 }}>{error}</p>}
        <button type="submit" disabled={sending} style={btn}>
          {sending ? 'Sending…' : 'Resend Verification Email'}
        </button>
      </form>
    ) : (
      <p style={{ ...sub, color:'#22C55E', marginTop:16 }}>✓ Sent! Check your inbox.</p>
    )
  )

  const content: Record<Status, { icon: string; title: string; body: React.ReactNode }> = {
    verifying: {
      icon:  '⏳',
      title: 'Verifying your email…',
      body:  <p style={sub}>Please wait a moment.</p>,
    },
    success: {
      icon:  '✅',
      title: 'Email verified!',
      body: (
        <>
          <p style={sub}>Your account is now active. Redirecting you to login…</p>
          <Link href="/login" style={btn}>Go to Login →</Link>
        </>
      ),
    },
    expired: {
      icon:  '⏰',
      title: 'Link expired',
      body: (
        <>
          <p style={sub}>This verification link has expired (links are valid for 24 hours). Enter your email to get a new one.</p>
          {resendForm}
        </>
      ),
    },
    invalid: {
      icon:  '❌',
      title: 'Invalid link',
      body: (
        <>
          <p style={sub}>This link is invalid or has already been used.</p>
          <Link href="/login" style={btn}>Back to Login</Link>
        </>
      ),
    },
    unverified: {
      icon:  '📧',
      title: 'Check your email',
      body: (
        <>
          <p style={sub}>We sent a verification link to your email address. Click the link in the email to activate your account.</p>
          <p style={{ ...sub, marginTop: 8 }}>Didn't get it? Check your spam folder or resend below.</p>
          {resendForm}
        </>
      ),
    },
  }

  const c = content[status]

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#FAFAFA', fontFamily:'DM Sans, Arial, sans-serif', padding:24 }}>
      <div style={{ width:'100%', maxWidth:440, background:'#fff', borderRadius:16,
        border:'1px solid #E8E8EC', boxShadow:'0 4px 24px rgba(0,0,0,.07)', padding:40, textAlign:'center' }}>

        <div style={{ fontSize:52, marginBottom:16 }}>{c.icon}</div>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#7C5CDB,#6146C4)',
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>C</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#09090b', margin:'0 0 8px', letterSpacing:-0.5 }}>{c.title}</h1>
        {c.body}

        <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid #E8E8EC' }}>
          <Link href="/home" style={{ fontSize:12, color:'#9591A8', textDecoration:'none' }}>
            ← Back to Codentia
          </Link>
        </div>
      </div>
    </div>
  )
}

// Styles
const sub: React.CSSProperties = { fontSize:14, color:'#71717a', lineHeight:1.6, margin:0 }
const btn: React.CSSProperties = {
  display:'inline-block', marginTop:16,
  background:'#7C5CDB', color:'#fff', textDecoration:'none',
  padding:'12px 28px', borderRadius:8, fontSize:14, fontWeight:700,
  border:'none', cursor:'pointer', width:'100%',
}
const input: React.CSSProperties = {
  width:'100%', height:42, padding:'0 14px',
  border:'1.5px solid #E4E4E7', borderRadius:8,
  fontSize:14, outline:'none', color:'#09090b',
  boxSizing:'border-box',
}

// Default export wraps the real component in Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAFA' }}>
        <p style={{ color:'#71717a', fontSize:14 }}>Loading…</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}