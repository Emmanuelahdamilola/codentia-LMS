'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CreateCourseForm() {
  const [form, setForm] = useState({
    title: '', description: '', difficulty: 'BEGINNER', category: '', published: false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ title: '', description: '', difficulty: 'BEGINNER', category: '', published: false })
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
          ✓ Course created!
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1.5">Course Title *</label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. JavaScript Fundamentals" required className="input text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1.5">Description *</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="What will students learn?" required rows={3} className="input text-sm resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#1A1523] mb-1.5">Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
            className="input text-sm">
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1A1523] mb-1.5">Category</label>
          <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            placeholder="e.g. Frontend" className="input text-sm" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.published}
          onChange={e => setForm(p => ({ ...p, published: e.target.checked }))}
          className="w-4 h-4 accent-[#7C5CDB]" />
        <span className="text-xs font-semibold text-[#1A1523]">Publish immediately</span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
        {loading && <Loader2 size={13} className="animate-spin" />}
        {loading ? 'Creating...' : 'Create Course'}
      </button>
    </form>
  )
}