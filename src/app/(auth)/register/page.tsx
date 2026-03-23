'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Code2, Eye, EyeOff, Loader2, Check } from 'lucide-react'

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${score < 2 ? 'text-red-500' : score < 3 ? 'text-amber-500' : 'text-green-600'}`}>
        {labels[score - 1] ?? 'Too short'}
      </p>
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Registration failed.'); return }
      // Auto sign in
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#8A70D6] p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white">Codentia</span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Start your<br />coding journey<br />today.
          </h2>
          <p className="text-purple-200 text-sm">Free to join. Learn at your own pace.</p>
        </div>
        <div className="relative z-10 space-y-3">
          {['Access all course videos', 'AI tutor 24/7', 'Live classes twice a week', 'Track your progress'].map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Check size={11} className="text-white" />
              </div>
              <span className="text-purple-100 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FBFBFB]">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#8A70D6] rounded-lg flex items-center justify-center">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="text-xl font-black text-[#424040]">Codentia</span>
          </div>

          <h1 className="text-2xl font-black text-[#424040] mb-1">Create your account</h1>
          <p className="text-[#8A8888] text-sm mb-8">Join thousands of students learning to code.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#424040] mb-1.5">Full Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="John Doe" required className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#424040] mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com" required className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#424040] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 8 characters" required className="input pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8888]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <StrengthBar password={form.password} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#424040] mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••" required className="input" />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-[#8A8888] text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#8A70D6] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}