// PATH: src/components/admin/CreateLessonForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, BookPlus } from 'lucide-react'

interface Module { id: string; title: string }

export default function CreateLessonForm({ modules }: { modules: Module[] }) {
  const [form, setForm] = useState({
    moduleId:      modules[0]?.id ?? '',
    title:         '',
    videoUrl:      '',
    content:       '',
    hasQuiz:       false,
    hasAssignment: false,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(true)
      setForm(p => ({ ...p, title: '', videoUrl: '', content: '' }))
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
          ✓ Lesson created!
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1.5">Module *</label>
        <select
          value={form.moduleId}
          onChange={e => setForm(p => ({ ...p, moduleId: e.target.value }))}
          className="input text-sm"
          required
        >
          {modules.length === 0
            ? <option value="">No modules yet — create a module first</option>
            : modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)
          }
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1.5">Lesson Title *</label>
        <input
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Introduction to Variables"
          required
          className="input text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1.5">
          Video URL
          <span className="text-[#8A8888] font-normal ml-1">(YouTube / Vimeo embed)</span>
        </label>
        <input
          type="url"
          value={form.videoUrl}
          onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
          placeholder="https://www.youtube.com/embed/..."
          className="input text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1.5">
          Lesson Content
          <span className="text-[#8A8888] font-normal ml-1">(Markdown supported)</span>
        </label>
        <textarea
          value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          placeholder="# Lesson Title&#10;&#10;Write your lesson content here..."
          rows={6}
          className="input text-sm resize-y font-code"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.hasQuiz}
            onChange={e => setForm(p => ({ ...p, hasQuiz: e.target.checked }))}
            className="w-4 h-4 accent-[#8A70D6]"
          />
          <span className="text-xs font-semibold text-[#424040]">Has Quiz</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.hasAssignment}
            onChange={e => setForm(p => ({ ...p, hasAssignment: e.target.checked }))}
            className="w-4 h-4 accent-[#8A70D6]"
          />
          <span className="text-xs font-semibold text-[#424040]">Has Assignment</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !form.title.trim() || !form.moduleId}
        className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading
          ? <><Loader2 size={13} className="animate-spin" /> Creating...</>
          : <><BookPlus size={13} /> Add Lesson</>
        }
      </button>
    </form>
  )
}