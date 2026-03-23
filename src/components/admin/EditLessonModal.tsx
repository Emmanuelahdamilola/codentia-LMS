// PATH: src/components/admin/EditLessonModal.tsx
'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Trash2, Link2, Upload, CheckCircle } from 'lucide-react'

interface Lesson {
  id: string; title: string; videoUrl: string | null
  content: string | null; hasQuiz: boolean; hasAssignment: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────
function toEmbedUrl(raw: string): string {
  // YouTube: watch?v=ID → embed/ID
  const ytMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo: vimeo.com/ID → player.vimeo.com/video/ID
  const vmMatch = raw.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  // Loom: loom.com/share/ID → loom.com/embed/ID
  const loomMatch = raw.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`
  // Already an embed URL or R2 URL — return as-is
  return raw
}

// ── R2 File Upload ────────────────────────────────────────────────────
function VideoUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [status,   setStatus]   = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error,    setError]    = useState('')

  async function handleFile(file: File) {
    const MAX_MB = 500
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB}MB.`); setStatus('error'); return
    }
    setFileName(file.name); setStatus('uploading'); setProgress(10); setError('')
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, folder: 'videos', sizeBytes: file.size }),
      })
      const presign = await presignRes.json()
      if (!presignRes.ok) throw new Error(presign.error ?? 'Failed to get upload URL')
      setProgress(30)
      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT', body: file, headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')
      setProgress(100); setStatus('done')
      onUpload(presign.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  if (status === 'done') return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
      <span className="text-[13px] text-green-700 font-medium truncate">{fileName}</span>
    </div>
  )

  return (
    <div>
      <label className={`flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
        status === 'uploading' ? 'border-[#8A70D6] bg-[#F8F6FF] cursor-wait'
        : status === 'error'   ? 'border-red-300 bg-red-50'
        : 'border-[#C4B8EE] hover:border-[#8A70D6] hover:bg-[#F8F6FF]'
      }`}>
        <input type="file" accept="video/mp4,video/webm,video/mov,video/quicktime" className="hidden"
          disabled={status === 'uploading'}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {status === 'uploading' ? (
          <>
            <Loader2 size={22} className="text-[#8A70D6] animate-spin" />
            <span className="text-[13px] font-medium text-[#424040]">Uploading {fileName}…</span>
            <div className="w-full h-1.5 bg-[#E9E3FF] rounded-full overflow-hidden">
              <div className="h-full bg-[#8A70D6] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : status === 'error' ? (
          <>
            <span className="text-[13px] font-medium text-red-600">{error}</span>
            <span className="text-[12px] text-red-400">Click to try again</span>
          </>
        ) : (
          <>
            <Upload size={22} className="text-[#C4B8EE]" />
            <span className="text-[13px] font-semibold text-[#424040]">Upload Video</span>
            <span className="text-[11px] text-[#8A8888]">MP4, WebM, MOV · Max 500MB</span>
          </>
        )}
      </label>
      {!process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL && status === 'idle' && (
        <p className="text-[11px] text-amber-600 mt-1.5">
          ⚠️ Set STORAGE_* env vars in .env.local to enable R2 uploads
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export default function EditLessonModal({ lesson }: { lesson: Lesson }) {
  const [open,    setOpen]    = useState(false)
  const [form,    setForm]    = useState({
    title: lesson.title, videoUrl: lesson.videoUrl ?? '',
    content: lesson.content ?? '', hasQuiz: lesson.hasQuiz, hasAssignment: lesson.hasAssignment,
  })
  const [videoTab,  setVideoTab]  = useState<'embed'|'upload'>('embed')
  const [rawUrl,    setRawUrl]    = useState(lesson.videoUrl ?? '')
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [preview,   setPreview]   = useState(false)
  const router = useRouter()

  function applyUrl(url: string) {
    const embed = toEmbedUrl(url)
    setForm(p => ({ ...p, videoUrl: embed }))
    setRawUrl(url)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, ...form }),
      })
      if (!res.ok) throw new Error('Save failed')
      setOpen(false); router.refresh()
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await fetch('/api/admin/lessons', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      setOpen(false); router.refresh()
    } finally { setDeleting(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-[#8A70D6] font-semibold hover:underline">
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4F0]">
              <h3 className="font-black text-[#424040] text-[15px]">Edit Lesson</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-[#8A8888] mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required className="w-full border border-[#EBEBEB] rounded-lg px-3 h-[38px] text-[13px] text-[#424040] bg-[#FBFBFB] outline-none focus:border-[#8A70D6] transition-colors" />
              </div>

              {/* Video section */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-[#8A8888] mb-1.5">Video</label>

                {/* Tab switcher */}
                <div className="flex gap-1 p-1 rounded-lg bg-[#F4F4F6] border border-[#E8E8EC] mb-3 w-fit">
                  {([['embed', <Link2 size={12}/>, 'Embed URL'], ['upload', <Upload size={12}/>, 'Upload to R2']] as const).map(([key, icon, label]) => (
                    <button key={key} type="button" onClick={() => setVideoTab(key as any)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all"
                      style={{
                        background: videoTab === key ? '#fff' : 'transparent',
                        color:      videoTab === key ? '#8A70D6' : '#8A8888',
                        boxShadow:  videoTab === key ? '0 1px 3px rgba(0,0,0,.07)' : 'none',
                      }}>
                      {icon}{label}
                    </button>
                  ))}
                </div>

                {videoTab === 'embed' ? (
                  <div className="flex flex-col gap-2">
                    <input type="url" value={rawUrl}
                      onChange={e => { setRawUrl(e.target.value); applyUrl(e.target.value) }}
                      placeholder="YouTube, Vimeo, Loom, or direct embed URL"
                      className="w-full border border-[#EBEBEB] rounded-lg px-3 h-[38px] text-[13px] text-[#424040] bg-[#FBFBFB] outline-none focus:border-[#8A70D6] transition-colors" />
                    {form.videoUrl && (
                      <div className="flex items-center gap-2 text-[11px] text-[#22C55E] font-medium">
                        <CheckCircle size={12} />
                        Embed URL ready: {form.videoUrl.slice(0, 50)}…
                      </div>
                    )}
                    <p className="text-[11px] text-[#8A8888]">
                      Supports: YouTube, Vimeo, Loom, or any <code>https://...embed...</code> URL. YouTube watch links are auto-converted.
                    </p>
                  </div>
                ) : (
                  <VideoUpload onUpload={url => setForm(p => ({ ...p, videoUrl: url }))} />
                )}

                {/* Preview */}
                {form.videoUrl && (
                  <div className="mt-3">
                    <button type="button" onClick={() => setPreview(p => !p)}
                      className="text-[11px] font-bold text-[#8A70D6] hover:underline">
                      {preview ? 'Hide preview' : 'Preview video'}
                    </button>
                    {preview && (
                      <div className="mt-2 rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                        {form.videoUrl.match(/\.(mp4|webm|mov)$/i) ? (
                          <video src={form.videoUrl} controls className="w-full h-full" />
                        ) : (
                          <iframe src={form.videoUrl} className="w-full h-full" allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-[#8A8888] mb-1.5">Lesson Content (Markdown)</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  rows={8} placeholder="# Lesson title&#10;&#10;Write your lesson content in Markdown..."
                  className="w-full border border-[#EBEBEB] rounded-lg px-3 py-2 text-[13px] text-[#424040] bg-[#FBFBFB] outline-none focus:border-[#8A70D6] transition-colors resize-y font-mono" />
              </div>

              {/* Flags */}
              <div className="flex gap-6">
                {([['hasQuiz', 'Has Quiz'], ['hasAssignment', 'Has Assignment']] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-[#8A70D6]" />
                    <span className="text-[13px] font-semibold text-[#424040]">{label}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-[#E8E4F0]">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6B52B8] disabled:opacity-60"
                  style={{ background: '#8A70D6' }}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[13px] text-[#EF4444] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#EF4444] hover:text-white transition-all disabled:opacity-60">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}