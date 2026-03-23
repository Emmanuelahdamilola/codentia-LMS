// PATH: src/components/dashboard/AssignmentForm.tsx
'use client'

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import FileUpload     from '@/components/ui/FileUpload'

export default function AssignmentForm({ assignmentId }: { assignmentId: string }) {
  const [form, setForm] = useState({ githubUrl: '', liveUrl: '', notes: '' })
  const [fileUrl, setFileUrl]     = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error,   setError]       = useState('')
  const [success, setSuccess]     = useState(false)
  const router = useRouter()

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.githubUrl.trim() && !form.liveUrl.trim() && !fileUrl) {
      setError('Please provide at least a GitHub URL, Live URL, or upload a file.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/assignments/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          assignmentId,
          githubUrl: form.githubUrl.trim() || null,
          liveUrl:   form.liveUrl.trim()   || null,
          fileUrl:   fileUrl               || null,
          notes:     form.notes.trim()     || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,.06)]">
        <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4 text-[22px]">✓</div>
        <h3 className="text-[16px] font-black text-[#22C55E] mb-2">Submitted!</h3>
        <p className="text-[13px] text-[#8A8888]">AI feedback is being generated. Your instructor will review shortly.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
      <h2 className="text-[15px] font-bold text-[#424040] mb-5">Submit Your Assignment</h2>

      {error && (
        <div className="mb-4 bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-[13px] font-medium px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* GitHub URL */}
        <div>
          <label className="block text-[13px] font-bold text-[#424040] mb-1.5">
            GitHub Repository URL
          </label>
          <div className="flex items-center border border-[#EBEBEB] rounded-lg overflow-hidden bg-[#FBFBFB]">
            <div className="px-3 h-[38px] flex items-center border-r border-[#EBEBEB] bg-white text-[13px] text-[#8A8888] whitespace-nowrap flex-shrink-0">
              github.com/
            </div>
            <input
              type="text"
              value={form.githubUrl}
              onChange={set('githubUrl')}
              placeholder="username/your-project"
              className="flex-1 border-none bg-transparent px-3 h-[38px] text-[13px] text-[#424040] outline-none placeholder:text-[#8A8888]"
            />
          </div>
        </div>

        {/* Live URL */}
        <div>
          <label className="block text-[13px] font-bold text-[#424040] mb-1.5">
            Live Project URL <span className="text-[11px] text-[#8A8888] font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={form.liveUrl}
            onChange={set('liveUrl')}
            placeholder="https://your-project.vercel.app"
            className="w-full border border-[#EBEBEB] rounded-lg px-3 h-[38px] text-[13px] text-[#424040] outline-none bg-[#FBFBFB] placeholder:text-[#8A8888] focus:border-[#8A70D6] transition-colors"
          />
        </div>

        {/* File upload — wired to R2 via presign API */}
        <div>
          <label className="block text-[13px] font-bold text-[#424040] mb-1.5">
            Upload File <span className="text-[11px] text-[#8A8888] font-normal">(optional — .zip, .pdf)</span>
          </label>
          <FileUpload
            folder="assignments"
            accept=".zip,.tar.gz,.pdf,.txt"
            maxSizeMB={50}
            label="Drag & drop your file, or click to browse"
            currentUrl={fileUrl}
            onUpload={url => setFileUrl(url)}
            onError={msg => setError(msg)}
          />
          {fileUrl && (
            <p className="text-[11px] text-[#22C55E] mt-1 font-medium">✓ File uploaded and ready to submit</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[13px] font-bold text-[#424040] mb-1.5">
            Notes to Instructor <span className="text-[11px] text-[#8A8888] font-normal">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="Any context about your submission, challenges you faced..."
            className="w-full border border-[#EBEBEB] rounded-lg px-3 py-2.5 text-[13px] text-[#424040] outline-none bg-[#FBFBFB] placeholder:text-[#8A8888] focus:border-[#8A70D6] transition-colors resize-y min-h-[80px]"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-white font-bold text-[14px] py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
          style={{ background: '#8A70D6' }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = '#6B52B8')}
          onMouseLeave={e => !loading && (e.currentTarget.style.background = '#8A70D6')}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Submitting…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"/>
              </svg>
              Submit Assignment
            </>
          )}
        </button>

        {!loading && (
          <p className="text-[11px] text-[#8A8888] text-center">
            AI feedback will be generated automatically after submission.
          </p>
        )}
      </form>
    </div>
  )
}