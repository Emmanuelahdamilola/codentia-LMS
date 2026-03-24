'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  if (!password) return null
  const colors = ['#ef4444','#f97316','#eab308','#22c55e']
  const labels = ['Weak','Fair','Good','Strong']
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score - 1] : '#e4e4e7',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: score < 2 ? '#ef4444' : score < 3 ? '#f97316' : score < 4 ? '#eab308' : '#22c55e' }}>
        {labels[score - 1] ?? 'Too short'}
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Registration failed.'); return }
      
      router.push('/login')
    } finally { setLoading(false) }
  }

  const steps = [
    { icon: '⚡', title: 'Instant access', desc: 'Start learning in under 60 seconds' },
    { icon: '🤖', title: 'AI tutor 24/7',  desc: 'Get unstuck anytime, on any topic' },
    { icon: '📹', title: 'Live classes',    desc: 'Twice a week with real instructors' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #fafafa;
        }

        @media (max-width: 900px) {
          .reg-root { grid-template-columns: 1fr; }
          .reg-panel { display: none; }
        }

        /* ── Left form side ── */
        .reg-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #fafafa;
          order: 1;
        }

        .form-box {
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .form-box.visible { opacity: 1; transform: translateY(0); }

        .mobile-logo {
          display: none;
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #09090b;
          letter-spacing: -.5px;
          align-items: center;
          gap: 8px;
          margin-bottom: 36px;
        }
        .mobile-logo-dot { width: 7px; height: 7px; border-radius: 50%; background: #8A70D6; }
        @media (max-width: 900px) { .mobile-logo { display: flex; } }

        .form-heading {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #09090b; letter-spacing: -1px; margin-bottom: 6px;
        }
        .form-sub { font-size: 14px; color: #71717a; margin-bottom: 28px; line-height: 1.5; }

        .form-error {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; font-size: 13px;
          padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }

        .field { margin-bottom: 16px; }
        .field label {
          display: block; font-size: 13px; font-weight: 600;
          color: #3f3f46; margin-bottom: 7px;
        }
        .input-wrap { position: relative; }
        .auth-input {
          width: 100%; height: 46px; padding: 0 14px;
          border: 1.5px solid #e4e4e7; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          color: #09090b; background: #fff; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .auth-input:focus {
          border-color: #8A70D6;
          box-shadow: 0 0 0 3px rgba(138,112,214,.12);
        }
        .auth-input.has-icon { padding-right: 44px; }
        .auth-input.valid { border-color: #22c55e; }
        .auth-input.invalid { border-color: #ef4444; }

        .eye-btn {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #a1a1aa; display: flex; padding: 4px;
        }
        .eye-btn:hover { color: #52525b; }

        .match-msg { font-size: 11px; margin-top: 5px; font-weight: 600; }
        .match-msg.ok { color: #22c55e; }
        .match-msg.bad { color: #ef4444; }

        .submit-btn {
          width: 100%; height: 48px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #8A70D6, #6B52B8);
          color: #fff; font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; cursor: pointer;
          letter-spacing: -.2px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
          transition: opacity .15s, transform .1s;
          box-shadow: 0 4px 16px rgba(138,112,214,.35);
        }
        .submit-btn:hover { opacity: .92; transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .terms-note {
          font-size: 11px; color: #a1a1aa;
          text-align: center; margin-top: 12px; line-height: 1.5;
        }

        .form-footer {
          text-align: center; font-size: 13px;
          color: #71717a; margin-top: 22px;
        }
        .form-footer a { color: #8A70D6; font-weight: 600; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        /* ── Right panel ── */
        .reg-panel {
          order: 2;
          background: #09090b;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 56px;
          position: relative;
          overflow: hidden;
        }

        .panel-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(138,112,214,.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(138,112,214,.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .panel-glow {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(138,112,214,.3) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          filter: blur(50px);
        }

        .panel-content { position: relative; z-index: 2; }

        .wordmark {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #fff; letter-spacing: -.5px;
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 56px;
        }
        .wordmark-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #8A70D6; box-shadow: 0 0 12px #8A70D6;
        }

        .panel-headline {
          font-family: 'Syne', sans-serif;
          font-size: 36px; font-weight: 800;
          color: #fff; line-height: 1.15;
          letter-spacing: -1.5px; margin-bottom: 16px;
        }
        .panel-headline em {
          font-style: normal;
          background: linear-gradient(135deg, #8A70D6, #C4B0FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .panel-sub { color: rgba(255,255,255,.4); font-size: 14px; margin-bottom: 48px; line-height: 1.6; }

        .steps { display: flex; flex-direction: column; gap: 20px; }

        .step {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 20px; border-radius: 12px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          transition: background .2s;
        }
        .step:hover { background: rgba(255,255,255,.07); }

        .step-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(138,112,214,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }

        .step-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .step-desc { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.4; }
      `}</style>

      <div className="reg-root">
        {/* ── Left: form ── */}
        <div className="reg-form-side">
          <div className={`form-box ${mounted ? 'visible' : ''}`}>

            <div className="mobile-logo">
              <div className="mobile-logo-dot" />
              Codentia
            </div>

            <h1 className="form-heading">Create your account</h1>
            <p className="form-sub">Join thousands of students learning to code.</p>

            {error && (
              <div className="form-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Full name</label>
                <input className="auth-input" type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ada Lovelace" required autoComplete="name" />
              </div>

              <div className="field">
                <label>Email address</label>
                <input className="auth-input" type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com" required autoComplete="email" />
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <input className="auth-input has-icon" type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 8 characters" required autoComplete="new-password" />
                  <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <StrengthBar password={form.password} />
              </div>

              <div className="field">
                <label>Confirm password</label>
                <input
                  className={`auth-input ${form.confirm ? (form.password === form.confirm ? 'valid' : 'invalid') : ''}`}
                  type="password" value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••" required autoComplete="new-password" />
                {form.confirm && (
                  <p className={`match-msg ${form.password === form.confirm ? 'ok' : 'bad'}`}>
                    {form.password === form.confirm ? '✓ Passwords match' : '✗ Passwords don\'t match'}
                  </p>
                )}
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <><div className="spinner" />Creating account…</> : 'Create Account →'}
              </button>
            </form>

            <p className="terms-note">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

            <p className="form-footer">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>

        {/* ── Right: panel ── */}
        <div className="reg-panel">
          <div className="panel-grid" />
          <div className="panel-glow" />

          <div className="panel-content">
            <div className="wordmark">
              <div className="wordmark-dot" />
              Codentia
            </div>

            <h2 className="panel-headline">
              Your first line<br />of code is<br /><em>one click away.</em>
            </h2>
            <p className="panel-sub">
              No experience required. We'll take you from zero to job-ready.
            </p>

            <div className="steps">
              {steps.map(s => (
                <div key={s.title} className="step">
                  <div className="step-icon">{s.icon}</div>
                  <div>
                    <div className="step-title">{s.title}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}