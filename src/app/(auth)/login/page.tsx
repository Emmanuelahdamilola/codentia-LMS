'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Code2, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#8A70D6] p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white">Codentia</span>
          </div>

          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Learn to code.<br />Build real things.<br />Get hired.
          </h2>
          <p className="text-purple-200 text-sm leading-relaxed">
            Join our hybrid coding academy — self-paced lessons, live classes twice a week, 
            and an AI tutor available 24/7.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { emoji: '🤖', label: 'AI Coding Tutor — always available' },
            { emoji: '📹', label: 'Live classes 2× per week' },
            { emoji: '🚀', label: 'Real projects & code reviews' },
            { emoji: '🏆', label: 'Track your progress daily' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-purple-100 text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FBFBFB]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#8A70D6] rounded-lg flex items-center justify-center">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="text-xl font-black text-[#424040]">Codentia</span>
          </div>

          <h1 className="text-2xl font-black text-[#424040] mb-1">Welcome back</h1>
          <p className="text-[#8A8888] text-sm mb-8">Sign in to continue your learning journey.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#424040] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-[#424040]">Password</label>
                <button type="button" className="text-xs text-[#8A70D6] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8888] hover:text-[#424040]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-[#8A8888] text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#8A70D6] font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Dev hint */}
          <div className="mt-8 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <strong>Demo credentials:</strong><br />
            Admin: admin@codentia.dev / admin123<br />
            Student: john@example.com / student123
          </div>
        </div>
      </div>
    </div>
  )
}