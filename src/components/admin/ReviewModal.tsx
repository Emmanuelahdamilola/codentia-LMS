'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReviewModal({ submission }: { submission: any }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ grade: submission.grade ?? '', feedback: submission.feedback ?? '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/admin/submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id, grade: Number(form.grade), feedback: form.feedback }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-xs px-3 py-1.5">
        {submission.status === 'PENDING' ? 'Review' : 'Edit Grade'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E9E7EF]">
              <div>
                <h3 className="font-bold text-[#1A1523]">Review Submission</h3>
                <p className="text-xs text-[#9591A8]">{submission.user.name} · {submission.assignment.title}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* AI Feedback preview */}
              {submission.aiFeedback && (
                <div className="bg-[#FAF8FF] border border-[#C8C1E8] rounded-lg p-3">
                  <p className="text-xs font-bold text-[#7C5CDB] mb-1">🤖 AI Pre-review</p>
                  <p className="text-xs text-[#1A1523] whitespace-pre-wrap">{submission.aiFeedback}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#1A1523] mb-1.5">Grade (0–100)</label>
                <input type="number" min="0" max="100" value={form.grade}
                  onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                  required className="input w-28" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A1523] mb-1.5">Written Feedback</label>
                <textarea value={form.feedback}
                  onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))}
                  rows={5} required className="input resize-none"
                  placeholder="Provide specific, constructive feedback to the student..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  {loading ? 'Saving...' : 'Submit Grade & Feedback'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}