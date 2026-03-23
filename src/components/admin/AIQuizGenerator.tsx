'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

interface Lesson { id: string; title: string; module: { course: { title: string } } }

export default function AIQuizGenerator({ lessons }: { lessons: Lesson[] }) {
  const [form, setForm] = useState({ lessonId: lessons[0]?.id ?? '', prompt: '', count: 5 })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{ question: string; options: string[]; correctIndex: number }[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function generate() {
    if (!form.prompt.trim()) return
    setLoading(true)
    setPreview(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setPreview(data.questions ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function saveQuiz() {
    if (!preview) return
    setSaving(true)
    try {
      await fetch('/api/admin/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: form.lessonId, questions: preview }),
      })
      setSaved(true)
      setPreview(null)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1">Lesson</label>
        <select value={form.lessonId} onChange={e => setForm(p => ({ ...p, lessonId: e.target.value }))}
          className="input text-sm">
          {lessons.map(l => (
            <option key={l.id} value={l.id}>
              {l.module.course.title} — {l.title}
            </option>
          ))}
        </select>
        {lessons.length === 0 && (
          <p className="text-xs text-[#8A8888] mt-1">All lessons already have quizzes.</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1">Prompt</label>
        <textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))}
          rows={3} className="input text-sm resize-none"
          placeholder='e.g. "5 beginner questions about JavaScript variables"' />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1">Number of questions</label>
        <select value={form.count} onChange={e => setForm(p => ({ ...p, count: Number(e.target.value) }))}
          className="input text-sm w-24">
          {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <button onClick={generate} disabled={loading || !form.prompt.trim() || lessons.length === 0}
        className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 size={13} className="animate-spin" /> Generating...</> : <><Sparkles size={13} /> Generate Quiz</>}
      </button>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
          ✓ Quiz saved successfully!
        </div>
      )}

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="border-t border-[#E8E4F0] pt-4 space-y-3">
          <p className="text-xs font-bold text-[#424040]">Preview ({preview.length} questions)</p>
          {preview.map((q, i) => (
            <div key={i} className="bg-[#F8F6FF] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#424040] mb-2">Q{i + 1}: {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, j) => (
                  <p key={j} className={`text-[11px] px-2 py-1 rounded ${
                    j === q.correctIndex ? 'bg-green-100 text-green-700 font-semibold' : 'text-[#8A8888]'
                  }`}>
                    {String.fromCharCode(65 + j)}. {opt}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <button onClick={saveQuiz} disabled={saving}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2">
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Quiz to Lesson'}
          </button>
        </div>
      )}
    </div>
  )
}