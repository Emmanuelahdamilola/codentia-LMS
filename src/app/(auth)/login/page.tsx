'use client'

import { Suspense, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Inner component — uses useSearchParams safely inside Suspense
// ─────────────────────────────────────────────────────────────
function LoginContent() {
  const searchParams = useSearchParams()
  const verified     = searchParams.get('verified')
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: form.email, password: form.password, redirect: false,
      })
      if (result?.error) setError('Invalid email or password.')
      else { router.push('/dashboard'); router.refresh() }
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #09090b;
        }

        @media (max-width: 900px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-panel { display: none; }
        }

        .auth-panel {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: #09090b;
        }

        .panel-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(138,112,214,.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(138,112,214,.12) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .panel-glow {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(138,112,214,.35) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(40px);
          animation: breathe 6s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: .8; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }

        .panel-content { position: relative; z-index: 2; }

        .wordmark {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wordmark-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #7C5CDB;
          box-shadow: 0 0 12px #7C5CDB;
        }

        .panel-headline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 3.5vw, 48px);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin-top: 64px;
        }

        .panel-headline em {
          font-style: normal;
          background: linear-gradient(135deg, #7C5CDB, #C4B0FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .panel-sub {
          color: rgba(255,255,255,.45);
          font-size: 15px;
          line-height: 1.6;
          margin-top: 20px;
          max-width: 340px;
        }

        .panel-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 56px;
        }

        .stat-card {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
          padding: 20px;
          transition: background .2s;
        }

        .stat-card:hover { background: rgba(255,255,255,.07); }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,.4);
          margin-top: 4px;
          font-weight: 500;
        }

        .panel-footer {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-stack { display: flex; }
        .avatar-stack span {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2px solid #09090b;
          margin-left: -8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }
        .avatar-stack span:first-child { margin-left: 0; }

        .footer-text {
          font-size: 13px;
          color: rgba(255,255,255,.4);
        }

        .auth-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #fafafa;
          position: relative;
        }

        .form-box {
          width: 100%;
          max-width: 400px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .5s ease, transform .5s ease;
        }

        .form-box.visible {
          opacity: 1;
          transform: translateY(0);
        }

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

        .mobile-logo-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #7C5CDB;
        }

        @media (max-width: 900px) {
          .mobile-logo { display: flex; }
        }

        .form-heading {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #09090b;
          letter-spacing: -1px;
          margin-bottom: 6px;
        }

        .form-sub {
          font-size: 14px;
          color: #71717a;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .form-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 13px;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .field { margin-bottom: 18px; }

        .field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #3f3f46;
          margin-bottom: 7px;
          letter-spacing: .01em;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
        }

        .field-row label {
          font-size: 13px;
          font-weight: 600;
          color: #3f3f46;
          margin-bottom: 0;
        }

        .forgot-link {
          font-size: 12px;
          color: #7C5CDB;
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover { text-decoration: underline; }

        .input-wrap { position: relative; }

        .auth-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1.5px solid #e4e4e7;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #09090b;
          background: #fff;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }

        .auth-input:focus {
          border-color: #7C5CDB;
          box-shadow: 0 0 0 3px rgba(138,112,214,.12);
        }

        .auth-input.has-icon { padding-right: 44px; }

        .eye-btn {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #a1a1aa;
          display: flex;
          padding: 4px;
        }
        .eye-btn:hover { color: #52525b; }

        .submit-btn {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          border: none;
          background: #09090b;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: -.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          transition: background .15s, transform .1s;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #7C5CDB, #6146C4);
          opacity: 0;
          transition: opacity .2s;
        }

        .submit-btn:hover::after { opacity: 1; }
        .submit-btn:hover { transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .submit-btn span { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-footer {
          text-align: center;
          font-size: 13px;
          color: #71717a;
          margin-top: 24px;
        }
        .form-footer a {
          color: #7C5CDB;
          font-weight: 600;
          text-decoration: none;
        }
        .form-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="auth-root">
        {/* ── Left panel ── */}
        <div className="auth-panel">
          <div className="panel-grid" />
          <div className="panel-glow" />

          <div className="panel-content">
            <div className="wordmark">
              <div className="wordmark-dot" />
              Codentia
            </div>
          </div>

          <div className="panel-content">
            <h2 className="panel-headline">
              Learn to code.<br />
              Build <em>real things.</em><br />
              Get hired.
            </h2>
            <p className="panel-sub">
              A hybrid coding academy with self-paced lessons, live classes twice a week, and an AI tutor available 24/7.
            </p>

            <div className="panel-stats">
              {[
                { num: '2,400+', label: 'Active students' },
                { num: '94%',    label: 'Completion rate' },
                { num: '48hrs',  label: 'Avg. to first project' },
                { num: '4.9★',  label: 'Student rating' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-content panel-footer">
            <div className="avatar-stack">
              {['#7C5CDB','#06B6D4','#10B981','#F59E0B'].map((c, i) => (
                <span key={i} style={{ background: c, zIndex: 4 - i }}>
                  {['A','B','C','D'][i]}
                </span>
              ))}
            </div>
            <p className="footer-text">Join 2,400+ students already learning</p>
          </div>
        </div>

        {/* ── Right form ── */}
        <div className="auth-form-side">
          <motion.div
            className="form-box visible"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.1 }}
          >

            <div className="mobile-logo">
              <div className="mobile-logo-dot" />
              Codentia
            </div>

            <h1 className="form-heading">Welcome back</h1>
            {verified && (
              <div style={{ background:'#DCFCE7', border:'1px solid #BBF7D0', color:'#15803D',
                fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>
                ✓ Email verified! You can now sign in.
              </div>
            )}
            <p className="form-sub">Sign in to continue your learning journey.</p>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="form-error"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email address</label>
                <input className="auth-input" type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com" required autoComplete="email" />
              </div>

              <div className="field">
                <div className="field-row">
                  <label>Password</label>
                  <button type="button" className="forgot-link">Forgot password?</button>
                </div>
                <div className="input-wrap">
                  <input className="auth-input has-icon" type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••" required autoComplete="current-password" />
                  <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>
                  {loading ? <><div className="spinner" />Signing in…</> : 'Sign In →'}
                </span>
              </button>
            </form>

            <p className="form-footer">
              Don&apos;t have an account?{' '}
              <Link href="/register">Create account</Link>
            </p>

          </motion.div>
        </div>
      </div>
    </>
  )
}


export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}