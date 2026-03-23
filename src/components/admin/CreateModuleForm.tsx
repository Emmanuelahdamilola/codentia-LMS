// PATH: src/components/admin/CreateModuleForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FolderPlus } from 'lucide-react'

export default function CreateModuleForm({ courseId }: { courseId: string }) {
  const [title, setTitle]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, title: title.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTitle('')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <div>
        <label className="block text-xs font-semibold text-[#424040] mb-1.5">
          Module Title *
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Module 1: Variables & Data Types"
          required
          className="input text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading
          ? <><Loader2 size={13} className="animate-spin" /> Creating...</>
          : <><FolderPlus size={13} /> Add Module</>
        }
      </button>
    </form>
  )
}