// PATH: src/components/admin/EditLessonModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter }            from 'next/navigation'
import { X, Loader2, Trash2, Link2, Upload, CheckCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface Lesson {
  id: string; title: string; videoUrl: string | null
  content: string | null; hasQuiz: boolean; hasAssignment: boolean
}

type Tab = 'lesson' | 'quiz' | 'assignment'

// ── Helpers ───────────────────────────────────────────────────
function toEmbedUrl(raw: string): string {
  const ytMatch   = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch)   return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vmMatch   = raw.match(/vimeo\.com\/(\d+)/)
  if (vmMatch)   return `https://player.vimeo.com/video/${vmMatch[1]}`
  const loomMatch = raw.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`
  return raw
}

// ── R2 Video Upload ───────────────────────────────────────────
function VideoUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [status,   setStatus]   = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error,    setError]    = useState('')

  async function handleFile(file: File) {
    if (file.size > 500 * 1024 * 1024) { setError('Max 500MB'); setStatus('error'); return }
    setFileName(file.name); setStatus('uploading'); setProgress(10); setError('')
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, folder: 'videos', sizeBytes: file.size }),
      })
      const presign = await presignRes.json()
      if (!presignRes.ok) throw new Error(presign.error ?? 'Presign failed')
      setProgress(30)
      const uploadRes = await fetch(presign.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!uploadRes.ok) throw new Error('Upload failed')
      setProgress(100); setStatus('done')
      onUpload(presign.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed'); setStatus('error')
    }
  }

  if (status === 'done') return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
      <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
      <span className="text-[12px] text-green-700 font-medium truncate">{fileName}</span>
    </div>
  )

  return (
    <label className={`flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
      status === 'uploading' ? 'border-[#7C5CDB] bg-[#FAF8FF] cursor-wait'
      : status === 'error'   ? 'border-red-300 bg-red-50'
      : 'border-[#C8C1E8] hover:border-[#7C5CDB] hover:bg-[#FAF8FF]'
    }`}>
      <input type="file" accept="video/mp4,video/webm,video/mov" className="hidden"
        disabled={status === 'uploading'}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {status === 'uploading' ? (
        <>
          <Loader2 size={20} className="text-[#7C5CDB] animate-spin" />
          <span className="text-[12px] font-medium text-[#1A1523]">Uploading {fileName}…</span>
          <div className="w-full h-1.5 bg-[#EDE8FF] rounded-full overflow-hidden">
            <div className="h-full bg-[#7C5CDB] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : status === 'error' ? (
        <>
          <span className="text-[12px] font-medium text-red-600">{error}</span>
          <span className="text-[11px] text-red-400">Click to retry</span>
        </>
      ) : (
        <>
          <Upload size={20} className="text-[#C8C1E8]" />
          <span className="text-[12px] font-semibold text-[#1A1523]">Upload Video</span>
          <span className="text-[11px] text-[#9591A8]">MP4, WebM, MOV · Max 500MB</span>
        </>
      )}
    </label>
  )
}

// ── Quiz Section ──────────────────────────────────────────────
function QuizSection({ lessonId, hasQuiz }: { lessonId: string; hasQuiz: boolean }) {
  const [prompt,   setPrompt]   = useState('')
  const [count,    setCount]    = useState(5)
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [preview,  setPreview]  = useState<{ question: string; options: string[]; correctIndex: number; explanation?: string }[] | null>(null)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const router = useRouter()

  async function generate() {
    if (!prompt.trim()) return
    setLoading(true); setPreview(null); setError(''); setSaved(false)
    try {
      const res  = await fetch('/api/admin/quiz/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setPreview(data.questions)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function saveQuiz() {
    if (!preview) return
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/quiz/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, questions: preview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSaved(true); setPreview(null); router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setSaving(false) }
  }

  const inputCls = "w-full border border-[#E8E8EC] rounded-lg px-3 h-[36px] text-[13px] text-[#1A1523] bg-[#F4F4F6] outline-none focus:border-[#7C5CDB] transition-colors"

  return (
    <div className="flex flex-col gap-4">

      {hasQuiz && !saved && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0]">
          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
          <span className="text-[12px] font-bold text-green-700">This lesson already has a quiz. Generating a new one will replace it.</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0]">
          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
          <span className="text-[12px] font-bold text-green-700">Quiz saved successfully!</span>
        </div>
      )}

      <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg,#7C5CDB,#6146C4)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[18px]">🤖</span>
          <span className="text-[14px] font-black text-white">AI Quiz Generator</span>
        </div>
        <p className="text-[12px] text-white/75">Describe the topic and AI will generate quiz questions instantly.</p>

        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. JavaScript closures, scope, and the difference between var, let and const..."
          rows={3}
          className="w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none"
          style={{ border: 'none', background: 'rgba(255,255,255,.9)', color: '#1A1523' }} />

        <div className="flex items-center gap-2">
          <label className="text-[12px] text-white/80 font-medium">Questions:</label>
          <select value={count} onChange={e => setCount(Number(e.target.value))}
            className="rounded-md px-2 py-1 text-[12px] outline-none"
            style={{ border: 'none', background: 'rgba(255,255,255,.9)', color: '#1A1523' }}>
            {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={generate} disabled={loading || !prompt.trim()}
            className="ml-auto px-4 py-1.5 rounded-lg font-bold text-[12px] text-white transition-colors disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)' }}>
            {loading ? 'Generating…' : '✨ Generate'}
          </button>
        </div>
      </div>

      {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="text-[13px] font-black text-[#1A1523]">Preview — {preview.length} questions</div>
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {preview.map((q, i) => (
              <div key={i} className="p-3 rounded-lg border border-[#E8E8EC] bg-[#F8F8FC]">
                <p className="text-[12px] font-bold text-[#1A1523] mb-2">Q{i+1}: {q.question}</p>
                <div className="flex flex-col gap-1">
                  {q.options.map((opt, j) => (
                    <div key={j} className={`text-[11px] px-2 py-1 rounded flex items-center gap-1.5 ${
                      j === q.correctIndex ? 'bg-[#DCFCE7] text-green-700 font-bold' : 'text-[#9591A8]'
                    }`}>
                      <span>{j === q.correctIndex ? '✓' : '○'}</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={saveQuiz} disabled={saving}
            className="w-full py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
            style={{ background: '#7C5CDB' }}>
            {saving ? 'Saving Quiz…' : `Save Quiz (${preview.length} questions)`}
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-[#E8E8EC]">
        <p className="text-[11px] text-[#9591A8]">
          You can also manage quizzes in detail from the <strong>Quizzes</strong> page in the sidebar.
        </p>
      </div>
    </div>
  )
}

// ── Assignment Section ────────────────────────────────────────
function AssignmentSection({ lessonId, hasAssignment }: { lessonId: string; hasAssignment: boolean }) {
  const [form,    setForm]    = useState({ title: '', description: '', dueDate: '', maxScore: 100 })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const [existing, setExisting] = useState<{ id: string; title: string; description: string; dueDate: string | null; maxScore: number } | null>(null)
  const [loading,  setLoading]  = useState(hasAssignment)
  const router = useRouter()

  // Load existing assignment if lesson has one
  useEffect(() => {
    if (!hasAssignment) { setLoading(false); return }
    fetch(`/api/admin/assignments?lessonId=${lessonId}`)
      .then(r => r.json())
      .then(d => {
        if (d.id) {
          setExisting(d)
          setForm({
            title:       d.title,
            description: d.description,
            dueDate:     d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 16) : '',
            maxScore:    d.maxScore ?? 100,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lessonId, hasAssignment])

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required'); return
    }
    setSaving(true); setError('')
    try {
      const url    = '/api/admin/assignments'
      const method = existing ? 'PATCH' : 'POST'
      const body   = existing
        ? { assignmentId: existing.id, ...form }
        : { lessonId, ...form }

      const res  = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setExisting(data); setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm('Delete this assignment? All student submissions will be lost.')) return
    try {
      await fetch('/api/admin/assignments', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: existing.id }),
      })
      setExisting(null)
      setForm({ title: '', description: '', dueDate: '', maxScore: 100 })
      router.refresh()
    } catch { setError('Delete failed') }
  }

  const inputCls = "w-full border border-[#E8E8EC] rounded-lg px-3 h-[38px] text-[13px] text-[#1A1523] bg-[#F4F4F6] outline-none focus:border-[#7C5CDB] transition-colors"
  const labelCls = "block text-[11px] font-bold uppercase tracking-[.5px] text-[#9591A8] mb-1.5"

  if (loading) return <div className="text-[13px] text-[#9591A8] py-4 text-center">Loading…</div>

  return (
    <div className="flex flex-col gap-4">

      {saved && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0]">
          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
          <span className="text-[12px] font-bold text-green-700">Assignment saved!</span>
        </div>
      )}

      {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

      <div>
        <label className={labelCls}>Assignment Title *</label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Build a Todo App with React" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Description & Requirements *</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={8}
          placeholder={`Describe what students need to build.\n\nRequirements:\n1. Create a React component that...\n2. Use useState to manage...\n3. Style with CSS modules...\n\nDeliverables:\n- GitHub repository URL\n- Live demo link`}
          className="w-full border border-[#E8E8EC] rounded-lg px-3 py-2.5 text-[13px] text-[#1A1523] bg-[#F4F4F6] outline-none focus:border-[#7C5CDB] transition-colors resize-y"
          style={{ minHeight: 160 }} />
        <p className="text-[11px] text-[#9591A8] mt-1">
          Use numbered lists for requirements. Students will see this formatted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Due Date (optional)</label>
          <input type="datetime-local" value={form.dueDate}
            onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
            className={inputCls} style={{ cursor: 'pointer' }} />
        </div>
        <div>
          <label className={labelCls}>Max Score</label>
          <input type="number" min="1" max="1000" value={form.maxScore}
            onChange={e => setForm(p => ({ ...p, maxScore: Number(e.target.value) }))}
            className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
          style={{ background: '#7C5CDB' }}>
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? 'Saving…' : existing ? 'Update Assignment' : 'Create Assignment'}
        </button>
        {existing && (
          <button onClick={handleDelete}
            className="px-4 py-2.5 rounded-lg font-bold text-[12px] text-[#EF4444] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#EF4444] hover:text-white transition-all">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-[#E8E8EC]">
        <p className="text-[11px] text-[#9591A8]">
          Students submit a GitHub URL, live demo link, or file upload. Submissions appear in the <strong>Assignments</strong> page for review.
        </p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function EditLessonModal({ lesson }: { lesson: Lesson }) {
  const [open,     setOpen]     = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('lesson')
  const [form,     setForm]     = useState({
    title: lesson.title, videoUrl: lesson.videoUrl ?? '',
    content: lesson.content ?? '', hasQuiz: lesson.hasQuiz, hasAssignment: lesson.hasAssignment,
  })
  const [videoTab, setVideoTab] = useState<'embed'|'upload'>('embed')
  const [rawUrl,   setRawUrl]   = useState(lesson.videoUrl ?? '')
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preview,  setPreview]  = useState(false)
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
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${lesson.title}"? Cannot be undone.`)) return
    setDeleting(true)
    try {
      await fetch('/api/admin/lessons', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      setOpen(false); router.refresh()
    } finally { setDeleting(false) }
  }

  const tabs: { key: Tab; label: string; icon: string; badge?: string }[] = [
    { key: 'lesson',     label: 'Lesson',     icon: '📖' },
    { key: 'quiz',       label: 'Quiz',       icon: '📝', badge: form.hasQuiz ? '✓' : undefined },
    { key: 'assignment', label: 'Assignment', icon: '🎯', badge: form.hasAssignment ? '✓' : undefined },
  ]

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-[#7C5CDB] font-semibold hover:underline">
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9E7EF] flex-shrink-0">
              <h3 className="font-black text-[#1A1523] text-[15px] truncate max-w-xs">{lesson.title}</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E9E7EF] flex-shrink-0 px-4">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold transition-colors relative"
                  style={{ color: activeTab === t.key ? '#7C5CDB' : '#9591A8',
                           borderBottom: activeTab === t.key ? '2px solid #7C5CDB' : '2px solid transparent' }}>
                  <span>{t.icon}</span>
                  {t.label}
                  {t.badge && (
                    <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#DCFCE7] text-green-700">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-5">

              {/* ── LESSON TAB ── */}
              {activeTab === 'lesson' && (
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-[#9591A8] mb-1.5">Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      required className="w-full border border-[#E9E7EF] rounded-lg px-3 h-[38px] text-[13px] text-[#1A1523] bg-[#F7F7F9] outline-none focus:border-[#7C5CDB] transition-colors" />
                  </div>

                  {/* Video */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-[#9591A8] mb-1.5">Video</label>
                    <div className="flex gap-1 p-1 rounded-lg bg-[#F4F4F6] border border-[#E8E8EC] mb-3 w-fit">
                      {([['embed', <Link2 size={11}/>, 'Embed URL'], ['upload', <Upload size={11}/>, 'Upload to R2']] as const).map(([key, icon, label]) => (
                        <button key={key} type="button" onClick={() => setVideoTab(key as any)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all"
                          style={{
                            background: videoTab === key ? '#fff' : 'transparent',
                            color:      videoTab === key ? '#7C5CDB' : '#9591A8',
                            boxShadow:  videoTab === key ? '0 1px 3px rgba(0,0,0,.07)' : 'none',
                          }}>
                          {icon}{label}
                        </button>
                      ))}
                    </div>

                    {videoTab === 'embed' ? (
                      <div className="flex flex-col gap-1.5">
                        <input type="url" value={rawUrl} onChange={e => { setRawUrl(e.target.value); applyUrl(e.target.value) }}
                          placeholder="YouTube, Vimeo, Loom, or embed URL"
                          className="w-full border border-[#E9E7EF] rounded-lg px-3 h-[38px] text-[13px] text-[#1A1523] bg-[#F7F7F9] outline-none focus:border-[#7C5CDB] transition-colors" />
                        {form.videoUrl && (
                          <p className="text-[11px] text-[#22C55E] font-medium flex items-center gap-1">
                            <CheckCircle size={11} /> Ready: {form.videoUrl.slice(0, 50)}…
                          </p>
                        )}
                        <p className="text-[11px] text-[#9591A8]">YouTube watch links are auto-converted to embed URLs.</p>
                      </div>
                    ) : (
                      <VideoUpload onUpload={url => setForm(p => ({ ...p, videoUrl: url }))} />
                    )}

                    {form.videoUrl && (
                      <div className="mt-2">
                        <button type="button" onClick={() => setPreview(p => !p)}
                          className="text-[11px] font-bold text-[#7C5CDB] hover:underline">
                          {preview ? 'Hide preview' : 'Preview video'}
                        </button>
                        {preview && (
                          <div className="mt-2 rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                            {form.videoUrl.match(/\.(mp4|webm|mov)(\?|$)/i)
                              ? <video src={form.videoUrl} controls className="w-full h-full" />
                              : <iframe src={form.videoUrl} className="w-full h-full" allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-[#9591A8] mb-1.5">Lesson Content (Markdown)</label>
                    <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      rows={8} placeholder="# Lesson Title&#10;&#10;Write your lesson notes in Markdown..."
                      className="w-full border border-[#E9E7EF] rounded-lg px-3 py-2 text-[13px] text-[#1A1523] bg-[#F7F7F9] outline-none focus:border-[#7C5CDB] transition-colors resize-y font-mono" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-[#E9E7EF]">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
                      style={{ background: '#7C5CDB' }}>
                      {saving && <Loader2 size={13} className="animate-spin" />}
                      {saving ? 'Saving…' : 'Save Lesson'}
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[13px] text-[#EF4444] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#EF4444] hover:text-white transition-all disabled:opacity-60">
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </form>
              )}

              {/* ── QUIZ TAB ── */}
              {activeTab === 'quiz' && (
                <QuizSection lessonId={lesson.id} hasQuiz={form.hasQuiz} />
              )}

              {/* ── ASSIGNMENT TAB ── */}
              {activeTab === 'assignment' && (
                <AssignmentSection lessonId={lesson.id} hasAssignment={form.hasAssignment} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}