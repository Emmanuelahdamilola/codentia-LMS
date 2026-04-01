// PATH: src/components/admin/AdminCoursesClient.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface CourseModule { id: string; title: string; lessonCount: number }

interface Course {
  id: string; title: string; description: string; difficulty: string
  published: boolean; thumbnail: string | null; price: number
  moduleCount: number; lessonCount: number; enrolled: number
  avgQuiz: number | null; avgProgress: number; fullyCompleted: number
  createdAt: string; modules: CourseModule[]
}

interface Stats {
  publishedCount: number; draftCount: number
  totalEnrolled:  number; avgQuiz:    number
}

interface Props { courses: Course[]; stats: Stats }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getCourseThumb(title: string): { bg: string; icon: string } {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css'))       return { bg: 'linear-gradient(135deg,#FF6B35,#F7931E)', icon: '🌐' }
  if (t.includes('javascript') || t.includes('js'))  return { bg: 'linear-gradient(135deg,#F0DB4F,#C8A800)', icon: '⚡' }
  if (t.includes('react'))                           return { bg: 'linear-gradient(135deg,#61DAFB,#0EA5E9)', icon: '⚛️' }
  if (t.includes('node') || t.includes('backend'))   return { bg: 'linear-gradient(135deg,#1a1a2e,#2D1B69)', icon: '🗄️' }
  if (t.includes('python'))                          return { bg: 'linear-gradient(135deg,#1e3a5f,#2563EB)', icon: '🐍' }
  return { bg: 'linear-gradient(135deg,#7C5CDB,#6146C4)', icon: '📚' }
}

// Generate a per-course AI insight based on real data
function courseInsight(c: Course): { icon: string; text: string; warn: boolean } {
  if (!c.published) return { icon: '📝', text: 'Draft course — finish adding content then publish.', warn: false }
  if (c.avgProgress < 40) {
    return { icon: '⚠️', text: `Low completion — students may be stuck. Consider reviewing Module 2 content.`, warn: true }
  }
  if (c.avgQuiz !== null && c.avgQuiz < 65) {
    return { icon: '⚠️', text: `Quiz scores are low (${c.avgQuiz}%). Consider adding more practice exercises.`, warn: true }
  }
  return { icon: '💡', text: `Strong performance. ${c.fullyCompleted > 0 ? `${c.fullyCompleted} students have fully completed this course.` : 'Keep an eye on drop-off in advanced modules.'}`, warn: false }
}

function Svg({ children, size = 17 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

function StatCard({ color, icon, delta, deltaDir, value, label }: {
  color: 'purple'|'green'|'amber'|'blue'
  icon: React.ReactNode; delta: string; deltaDir: 'up'|'neu'
  value: string|number; label: string
}) {
  const topBar = { purple:'#7C5CDB', green:'#16A34A', amber:'#F59E0B', blue:'#3B82F6' }[color]
  const iconBg = {
    purple:'bg-[#EDE8FF] text-[#7C5CDB]', green:'bg-[#DCFCE7] text-[#16A34A]',
    amber: 'bg-[#FEF3C7] text-[#D97706]', blue: 'bg-[#DBEAFE] text-[#3B82F6]',
  }[color]
  const deltaCls = deltaDir === 'up' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F7F7F9] text-[#9591A8]'
  return (
    <div className="bg-white rounded-2xl border border-[#E9E7EF] shadow-[0_2px_8px_rgba(15,13,26,0.06)] relative overflow-hidden" style={{ paddingTop: 3 }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${deltaCls}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-semibold leading-none tracking-tight mb-1" style={{ color: '#1A1523' }}>{value}</div>
        <div className="text-[12px] font-bold" style={{ color: '#9591A8' }}>{label}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Course editor slide-in panel
// ─────────────────────────────────────────────────────────────
function CourseEditor({ course, onClose, onSave }: {
  course: Course | 'new'; onClose: () => void; onSave: (id?: string) => void
}) {
  const isNew = course === 'new'
  const router = typeof window !== 'undefined' ? null : null

  const [form, setForm] = useState({
    title:       isNew ? '' : (course as Course).title,
    description: isNew ? '' : (course as Course).description,
    difficulty:  isNew ? 'BEGINNER' : (course as Course).difficulty.toUpperCase(),
    price:       isNew ? 0 : (course as Course).price,
    thumbnail:   isNew ? '' : ((course as Course).thumbnail ?? ''),
    published:   isNew ? false : (course as Course).published,
  })
  const [modules,      setModules]      = useState<CourseModule[]>(isNew ? [] : (course as Course).modules)
  const [newModTitle,  setNewModTitle]  = useState('')
  const [addingMod,    setAddingMod]    = useState(false)
  const [editingMod,   setEditingMod]   = useState<string | null>(null)
  const [editModTitle, setEditModTitle] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [thumbnailTab, setThumbnailTab] = useState<'url'|'upload'>('url')
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [aiQuizPrompt, setAiQuizPrompt] = useState('')
  const [aiQuizResult, setAiQuizResult] = useState<string | null>(null)
  const [aiLessonPrompt, setAiLessonPrompt] = useState('')
  const [aiLessonResult, setAiLessonResult] = useState<string | null>(null)
  const [aiLoading,    setAiLoading]    = useState<'quiz'|'lesson'|null>(null)
  const [aiError,      setAiError]      = useState('')

  const courseId = isNew ? null : (course as Course).id

  // ── Save course ──────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method:  isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...(courseId ? { courseId } : {}),
          title:       form.title.trim(),
          description: form.description.trim(),
          difficulty:  form.difficulty,
          price:       Number(form.price) || 0,
          thumbnail:   form.thumbnail.trim() || null,
          published:   form.published,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSave(data.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  // ── Add module ───────────────────────────────────────────
  async function handleAddModule() {
    if (!newModTitle.trim() || !courseId) return
    setAddingMod(true)
    try {
      const res = await fetch('/api/admin/modules', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courseId, title: newModTitle.trim() }),
      })
      const mod = await res.json()
      if (!res.ok) throw new Error(mod.error)
      setModules(p => [...p, { id: mod.id, title: mod.title, lessonCount: 0 }])
      setNewModTitle('')
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    finally { setAddingMod(false) }
  }

  // ── Rename module ────────────────────────────────────────
  async function handleRenameModule(moduleId: string) {
    if (!editModTitle.trim()) return
    try {
      await fetch('/api/admin/modules', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ moduleId, title: editModTitle.trim() }),
      })
      setModules(p => p.map(m => m.id === moduleId ? { ...m, title: editModTitle.trim() } : m))
      setEditingMod(null)
    } catch { alert('Failed to rename') }
  }

  // ── Delete module ────────────────────────────────────────
  async function handleDeleteModule(moduleId: string) {
    if (!confirm('Delete this module and all its lessons? Cannot be undone.')) return
    try {
      await fetch('/api/admin/modules', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ moduleId }),
      })
      setModules(p => p.filter(m => m.id !== moduleId))
    } catch { alert('Failed to delete') }
  }

  // ── AI Quiz Generator ────────────────────────────────────
  async function handleGenerateQuiz() {
    if (!aiQuizPrompt.trim()) return
    setAiLoading('quiz'); setAiQuizResult(null); setAiError('')
    try {
      const res  = await fetch('/api/admin/quiz/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: aiQuizPrompt, count: 5 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI failed')
      const qs = (data.questions as Array<{ question: string; options: string[]; correctIndex: number }>) ?? []
      setAiQuizResult(`Generated ${qs.length} questions:\n\n` + qs.map((q, i) =>
        `Q${i+1}: ${q.question}\n${q.options.map((o, j) => `  ${j === q.correctIndex ? '✓' : ' '} ${o}`).join('\n')}`
      ).join('\n\n'))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed')
    } finally { setAiLoading(null) }
  }

  // ── AI Lesson Assistant ──────────────────────────────────
  async function handleGenerateLesson() {
    if (!aiLessonPrompt.trim()) return
    setAiLoading('lesson'); setAiLessonResult(null); setAiError('')
    try {
      const res  = await fetch('/api/ai/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          question: `Write comprehensive lesson notes for: ${aiLessonPrompt}. Include key concepts, examples, and a summary.`,
          context:  'Admin lesson content creator',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI failed')
      setAiLessonResult(data.answer ?? 'No content generated')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed')
    } finally { setAiLoading(null) }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-[13px] outline-none"
  const inputSty = { border: '1px solid #E8E8EC', background: '#F7F7F9', color: '#1A1523' }
  const labelCls = "text-[11px] font-semibold uppercase tracking-[.5px] block mb-1.5"
  const labelSty = { color: '#9591A8' }

  return (
    <div className="fixed top-0 right-0 bottom-0 bg-white z-[5000] overflow-y-auto"
      style={{ width: 500, borderLeft: '1px solid #E8E8EC', boxShadow: '0 8px 32px rgba(0,0,0,.12)', animation: 'slideIn .22s ease' }}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3.5 z-10"
        style={{ borderBottom: '1px solid #E8E8EC' }}>
        <div className="text-[15px] font-bold" style={{ color: '#1A1523' }}>
          {isNew ? 'New Course' : `Edit: ${(course as Course).title}`}
        </div>
        <button onClick={onClose}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[16px]"
          style={{ border: '1px solid #E8E8EC', background: '#F7F7F9', color: '#9591A8' }}>✕</button>
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── Basic Info ── */}
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls} style={labelSty}>Course Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Advanced JavaScript" className={inputCls} style={inputSty} />
          </div>

          <div>
            <label className={labelCls} style={labelSty}>Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What will students learn?" rows={3}
              className={inputCls} style={{ ...inputSty, resize: 'vertical' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelSty}>Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                className={inputCls} style={{ ...inputSty, cursor: 'pointer' }}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelSty}>Price (USD) — 0 = Free</label>
              <input type="number" min="0" step="0.01"
                value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                placeholder="0.00 = Free"
                className={inputCls} style={inputSty} />
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelSty}>Course Thumbnail</label>
            {/* Tab: URL or Upload */}
            <div className="flex gap-1 p-0.5 rounded-lg mb-2 w-fit"
              style={{ background: '#E9E7EF' }}>
              {(['url', 'upload'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setThumbnailTab(t)}
                  className="px-3 py-1 rounded-md text-[11px] font-bold transition-all"
                  style={{
                    background: thumbnailTab === t ? '#fff' : 'transparent',
                    color:      thumbnailTab === t ? '#7C5CDB' : '#9591A8',
                    boxShadow:  thumbnailTab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  }}>
                  {t === 'url' ? '🔗 Paste URL' : '⬆️ Upload Image'}
                </button>
              ))}
            </div>

            {thumbnailTab === 'url' ? (
              <input type="url" value={form.thumbnail}
                onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
                placeholder="https://images.unsplash.com/... or any image URL"
                className={inputCls} style={inputSty} />
            ) : (
              <label className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                thumbnailUploading ? 'border-[#7C5CDB] bg-[#FAF8FF] cursor-wait' : 'border-[#D4CAF7] hover:border-[#7C5CDB] hover:bg-[#FAF8FF]'
              }`}>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                  disabled={thumbnailUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setThumbnailUploading(true)
                    try {
                      const presignRes = await fetch('/api/upload/presign', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: file.name, mimeType: file.type, folder: 'thumbnails', sizeBytes: file.size }),
                      })
                      const presign = await presignRes.json()
                      if (!presignRes.ok) throw new Error(presign.error ?? 'Upload failed')
                      await fetch(presign.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
                      setForm(p => ({ ...p, thumbnail: presign.publicUrl }))
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Upload failed — check R2 env vars')
                    } finally { setThumbnailUploading(false) }
                  }} />
                {thumbnailUploading ? (
                  <><span className="text-[12px] font-medium text-[#7C5CDB]">Uploading…</span></>
                ) : (
                  <><span className="text-[18px]">🖼️</span>
                  <span className="text-[12px] font-semibold text-[#1A1523]">Click to upload thumbnail</span>
                  <span className="text-[11px] text-[#9591A8]">JPG, PNG, WebP · Max 5MB</span></>
                )}
              </label>
            )}

            {form.thumbnail && (
              <div className="mt-2 relative">
                <img src={form.thumbnail} alt="Thumbnail preview"
                  className="rounded-lg object-cover w-full"
                  style={{ height: 120 }}
                  onError={e => (e.currentTarget.style.display = 'none')} />
                <button type="button" onClick={() => setForm(p => ({ ...p, thumbnail: '' }))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-[12px] flex items-center justify-center hover:bg-black/80 transition-colors">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: '#F7F7F9' }}>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "#1A1523" }}>
                {form.published ? '✓ Published' : 'Draft'}
              </div>
              <div className="text-[11px]" style={{ color: '#9591A8' }}>
                {form.published ? 'Visible to students' : 'Only admins can see this'}
              </div>
            </div>
            <button role="switch" aria-checked={form.published}
              onClick={() => setForm(p => ({ ...p, published: !p.published }))}
              className="relative flex-shrink-0 rounded-full transition-colors duration-200"
              style={{ width: 38, height: 22, background: form.published ? '#7C5CDB' : '#E9E7EF' }}>
              <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ left: 3, transform: form.published ? 'translateX(16px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>

        {/* ── Modules ── */}
        <div>
          <div className="text-[13px] font-bold mb-2.5" style={{ color: '#1A1523' }}>
            Modules {isNew && <span className="text-[11px] font-normal text-[#9591A8]">— save course first to add modules</span>}
          </div>

          {!isNew && (
            <>
              <div className="flex flex-col gap-1.5 mb-2">
                {modules.length === 0 && (
                  <div className="text-[12px] text-[#9591A8] py-2 text-center">No modules yet — add one below</div>
                )}
                {modules.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ border: '1px solid #E8E8EC', background: '#F7F7F9' }}>
                    <span className="text-[11px] font-bold w-5 text-center" style={{ color: '#BCBBBB' }}>{i + 1}</span>
                    {editingMod === m.id ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input value={editModTitle}
                          onChange={e => setEditModTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameModule(m.id); if (e.key === 'Escape') setEditingMod(null) }}
                          autoFocus
                          className="flex-1 rounded px-2 py-1 text-[12px] outline-none"
                          style={{ border: '1px solid #7C5CDB', background: '#fff', color: '#1A1523' }} />
                        <button onClick={() => handleRenameModule(m.id)}
                          className="text-[11px] font-bold px-2 py-1 rounded text-white" style={{ background: '#7C5CDB' }}>Save</button>
                        <button onClick={() => setEditingMod(null)}
                          className="text-[11px] font-bold px-2 py-1 rounded" style={{ color: '#9591A8' }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold truncate" style={{ color: '#1A1523' }}>{m.title}</div>
                          <div className="text-[11px]" style={{ color: '#9591A8' }}>{m.lessonCount} lesson{m.lessonCount !== 1 ? 's' : ''}</div>
                        </div>
                        <button onClick={() => { setEditingMod(m.id); setEditModTitle(m.title) }}
                          className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E9E7EF] bg-white hover:border-[#7C5CDB] hover:bg-[#EDE8FF] transition-all" title="Rename">
                          <Svg size={11}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                        </button>
                        <button onClick={() => handleDeleteModule(m.id)}
                          className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E9E7EF] bg-white hover:border-[#DC2626] hover:bg-[#FEF2F2] transition-all" title="Delete">
                          <Svg size={11}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></Svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Add module */}
              <div className="flex gap-2">
                <input value={newModTitle} onChange={e => setNewModTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                  placeholder="New module title…"
                  className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none"
                  style={{ border: '1.5px dashed #D4CAF7', background: '#FAF8FF', color: '#1A1523' }} />
                <button onClick={handleAddModule} disabled={addingMod || !newModTitle.trim()}
                  className="px-4 py-2 rounded-lg font-bold text-[12px] text-white transition-colors disabled:opacity-50"
                  style={{ background: '#7C5CDB' }}>
                  {addingMod ? '…' : '+ Add'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── AI Quiz Generator ── */}
        <div className="rounded-lg p-4" style={{ background: 'linear-gradient(135deg,#7C5CDB,#6146C4)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[16px]">🤖</span>
            <div className="text-[13px] font-bold text-white">AI Quiz Generator</div>
          </div>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,.75)' }}>
            Describe a topic and generate 5 quiz questions instantly.
          </p>
          <div className="flex gap-2 mb-2">
            <input value={aiQuizPrompt} onChange={e => setAiQuizPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateQuiz()}
              placeholder="e.g. JavaScript closures and scope"
              className="flex-1 rounded-md px-3 py-2 text-[12px] outline-none"
              style={{ border: 'none', background: 'rgba(255,255,255,.9)', color: '#1A1523' }} />
            <button onClick={handleGenerateQuiz} disabled={aiLoading === 'quiz' || !aiQuizPrompt.trim()}
              className="px-3 py-2 rounded-md font-bold text-[11px] text-white transition-colors whitespace-nowrap disabled:opacity-60"
              style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)' }}>
              {aiLoading === 'quiz' ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {aiQuizResult && (
            <pre className="text-[11px] rounded-md p-2.5 whitespace-pre-wrap"
              style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.9)', maxHeight: 200, overflowY: 'auto' }}>
              {aiQuizResult}
            </pre>
          )}
          {aiError && <p className="text-[11px] text-red-200 mt-1">{aiError}</p>}
        </div>

        {/* ── AI Lesson Assistant ── */}
        <div className="rounded-lg p-4" style={{ background: '#F7F7F9', border: '1px solid #E8E8EC' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[16px]">📝</span>
            <div className="text-[13px] font-semibold" style={{ color: "#1A1523" }}>AI Lesson Content Generator</div>
          </div>
          <p className="text-[12px] mb-3" style={{ color: '#9591A8' }}>
            Generate lesson notes and content for any topic.
          </p>
          <div className="flex gap-2 mb-2">
            <input value={aiLessonPrompt} onChange={e => setAiLessonPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateLesson()}
              placeholder="e.g. Explain JavaScript Promises"
              className="flex-1 rounded-md px-3 py-2 text-[12px] outline-none"
              style={{ border: '1px solid #E8E8EC', background: '#fff', color: '#1A1523' }} />
            <button onClick={handleGenerateLesson} disabled={aiLoading === 'lesson' || !aiLessonPrompt.trim()}
              className="px-3 py-2 rounded-md font-bold text-[11px] text-white transition-colors disabled:opacity-60"
              style={{ background: '#7C5CDB' }}>
              {aiLoading === 'lesson' ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {aiLessonResult && (
            <pre className="text-[11px] rounded-md p-2.5 whitespace-pre-wrap"
              style={{ background: '#fff', border: '1px solid #E8E8EC', color: '#1A1523', maxHeight: 200, overflowY: 'auto' }}>
              {aiLessonResult}
            </pre>
          )}
          {aiError && !aiQuizResult && <p className="text-[11px] text-red-500 mt-1">{aiError}</p>}
        </div>

        {/* ── Save / Cancel ── */}
        <div className="flex gap-2.5 pt-1">
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
            style={{ background: '#7C5CDB' }}>
            {saving ? 'Saving…' : isNew ? 'Create Course' : 'Save Changes'}
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E9E7EF] transition-colors"
            style={{ color: '#1A1523' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main component

// ─────────────────────────────────────────────────────────────
export default function AdminCoursesClient({ courses, stats }: Props) {
  const [filter,  setFilter]  = useState<'all'|'published'|'draft'>('all')
  const [editor,  setEditor]  = useState<Course | 'new' | null>(null)
  const [toast,   setToast]   = useState('')
  const [confirm, setConfirm] = useState<{ msg: string; label: string; color: string; cb: () => void } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const filtered = courses.filter(c => {
    if (filter === 'published') return  c.published
    if (filter === 'draft')     return !c.published
    return true
  })

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }} className="px-4 py-4 md:px-7 md:py-6 pb-12">

      {/* ── Page header + filter pills ── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] tracking-tight" style={{ color: '#1A1523' }}>Courses</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#9591A8' }}>Manage, edit, and publish your courses.</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex gap-1.5">
            {[
              { key: 'all',       label: `All (${courses.length})` },
              { key: 'published', label: `Published (${stats.publishedCount})` },
              { key: 'draft',     label: `Draft (${stats.draftCount})` },
            ].map(p => (
              <button key={p.key} onClick={() => setFilter(p.key as any)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150"
                style={{
                  background:  filter === p.key ? '#7C5CDB' : '#fff',
                  color:       filter === p.key ? '#fff'    : '#9591A8',
                  borderColor: filter === p.key ? '#7C5CDB' : '#E9E7EF',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Insight box ── */}
      {(() => {
        const worstCourse = [...courses.filter(c => c.published)].sort((a, b) => a.avgProgress - b.avgProgress)[0]
        const bestCourse  = [...courses.filter(c => c.published)].sort((a, b) => b.avgProgress - a.avgProgress)[0]
        return (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-5 text-[12px] leading-relaxed"
            style={{ background: '#EDE8FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
            <span className="text-[16px] flex-shrink-0">🤖</span>
            <div>
              <strong>Course Insights:</strong>{' '}
              {worstCourse && `${worstCourse.title} (${worstCourse.avgProgress}% completion) has the highest drop-off. `}
              {bestCourse  && `${bestCourse.title} (${bestCourse.avgProgress}% progress) is your strongest course. `}
              Consider adding a practice project after Module 3 in struggling courses to improve retention.
            </div>
          </div>
        )
      })()}

      {/* ── Course grid ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {filtered.map(c => {
          const thumb   = getCourseThumb(c.title)
          const insight = courseInsight(c)
          const progressBar = c.published ? c.avgProgress : 0
          const progressColor = c.published
            ? (c.avgProgress >= 60 ? '#16A34A' : c.avgProgress >= 40 ? '#7C5CDB' : '#7C5CDB')
            : '#E9E7EF'

          return (
            <div key={c.id}
              className="bg-white rounded-2xl border border-[#E9E7EF] overflow-hidden shadow-[0_2px_8px_rgba(15,13,26,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,.10)]">

              {/* Thumbnail */}
              <div className="h-[90px] relative flex items-center justify-center text-[32px]"
                style={{ background: thumb.bg }}>
                {thumb.icon}
                <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: c.published ? '#DCFCE7' : '#F7F7F9',
                    color:      c.published ? '#15803D' : '#9591A8',
                  }}>
                  {c.published ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="text-[13px] font-bold leading-snug mb-1" style={{ color: '#1A1523' }}>{c.title}</div>
                <div className="text-[11px] mb-2.5" style={{ color: '#9591A8' }}>
                  {c.moduleCount} modules · {c.lessonCount} lessons · {c.difficulty}
                </div>

                {c.published ? (
                  <>
                    {/* Stats row */}
                    <div className="flex gap-3 mb-2 text-[11px]" style={{ color: '#9591A8' }}>
                      <span><strong style={{ color: '#1A1523' }}>{c.enrolled}</strong> enrolled</span>
                      <span>Avg <strong style={{ color: '#1A1523' }}>{c.avgProgress}%</strong> progress</span>
                      {c.avgQuiz !== null && <span>Quiz avg <strong style={{ color: '#1A1523' }}>{c.avgQuiz}%</strong></span>}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#F7F7F9' }}>
                      <div className="h-full rounded-full" style={{ width: `${progressBar}%`, background: progressColor }} />
                    </div>
                    <div className="text-[10px] mb-2.5" style={{ color: '#9591A8' }}>
                      {c.avgProgress}% avg completion · {c.fullyCompleted} fully done
                    </div>

                    {/* Per-card AI insight */}
                    <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg mb-3 text-[11px] leading-snug"
                      style={{
                        background:   insight.warn ? '#FEF3C7' : '#EDE8FF',
                        border:       `1px solid ${insight.warn ? '#FDE68A' : '#D4CAF7'}`,
                        color:        insight.warn ? '#92400E' : '#4C3999',
                      }}>
                      <span className="text-[13px] flex-shrink-0">{insight.icon}</span>
                      <span>{insight.text}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditor(c)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-bold bg-[#EDE8FF] text-[#7C5CDB] hover:bg-[#D4CAF7] transition-colors">
                        <Svg size={11}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                        Edit
                      </button>
                      <button onClick={() => showToast('Students view opened')}
                        className="flex-1 flex items-center justify-center py-1.5 rounded-md text-[11px] font-bold border border-[#E9E7EF] text-[#1A1523] hover:border-[#7C5CDB] hover:text-[#7C5CDB] transition-all">
                        Students
                      </button>
                      <button onClick={() => setConfirm({ msg: `Unpublish "${c.title}"?`, label: 'Unpublish', color: '#F59E0B', cb: () => showToast('Course unpublished') })}
                        className="w-8 h-[30px] flex items-center justify-center rounded-md border border-[#E9E7EF] text-[#9591A8] hover:border-[#F59E0B] hover:bg-[#FEF3C7] transition-all">
                        <Svg size={11}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Draft progress */}
                    <div className="text-[11px] mb-1.5" style={{ color: '#9591A8' }}>Not published yet</div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#F7F7F9' }}>
                      <div className="h-full rounded-full bg-[#E8E8EC]" style={{ width: '40%' }} />
                    </div>

                    {/* Draft actions */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditor(c)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-bold bg-[#EDE8FF] text-[#7C5CDB] hover:bg-[#D4CAF7] transition-colors">
                        <Svg size={11}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                        Continue editing
                      </button>
                      <button onClick={() => setConfirm({ msg: `Publish "${c.title}" to all students?`, label: 'Publish', color: '#16A34A', cb: () => showToast('Course published ✓') })}
                        className="flex-none px-3 py-1.5 rounded-md text-[11px] font-bold text-white transition-colors"
                        style={{ background: '#16A34A' }}>
                        Publish
                      </button>
                      <button onClick={() => setConfirm({ msg: `Delete "${c.title}"? This cannot be undone.`, label: 'Delete', color: '#DC2626', cb: () => showToast('Draft deleted') })}
                        className="w-8 h-[30px] flex items-center justify-center rounded-md border border-[#E9E7EF] text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#DC2626] transition-all">
                        <Svg size={11}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></Svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {/* New course CTA */}
        <button onClick={() => setEditor('new')}
          className="rounded-xl border-2 border-dashed border-[#E9E7EF] flex items-center justify-center min-h-[220px] cursor-pointer transition-all hover:border-[#7C5CDB] hover:bg-[#EDE8FF]">
          <div className="text-center p-5">
            <div className="w-11 h-11 rounded-xl bg-[#EDE8FF] flex items-center justify-center mx-auto mb-3">
              <Svg size={20} ><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
            </div>
            <div className="text-[13px] font-bold text-[#7C5CDB]">Create new course</div>
            <div className="text-[11px] mt-1" style={{ color: '#9591A8' }}>Add modules, lessons, quizzes</div>
          </div>
        </button>
      </div>

      {/* ── Course editor slide-in ── */}
      {editor !== null && (
        <CourseEditor
          course={editor}
          onClose={() => setEditor(null)}
          onSave={(id) => { setEditor(null); showToast(id ? 'Course saved ✓' : 'Saved ✓') }}
        />
      )}

      {/* ── Confirm dialog ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-white rounded-xl p-7 w-[380px] shadow-2xl" style={{ animation: 'pop .18s ease' }}>
            <style>{`@keyframes pop{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <div className="text-[18px] mb-2">⚠️</div>
            <div className="text-[15px] font-bold mb-1.5" style={{ color: '#1A1523' }}>{confirm.label}?</div>
            <div className="text-[13px] mb-5" style={{ color: '#9591A8' }}>{confirm.msg}</div>
            <div className="flex gap-2.5">
              <button onClick={() => { confirm.cb(); setConfirm(null) }}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white"
                style={{ background: confirm.color }}>
                {confirm.label}
              </button>
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E9E7EF]"
                style={{ color: '#1A1523' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white z-[9999]"
          style={{ background: '#1A1730', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          ✓ {toast}
        </div>
      )}
    </motion.div>
  )
}