// PATH: src/components/admin/AdminCoursesClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Course {
  id: string; title: string; description: string; difficulty: string
  published: boolean; thumbnail: string | null
  moduleCount: number; lessonCount: number; enrolled: number
  avgQuiz: number | null; avgProgress: number; fullyCompleted: number
  createdAt: string
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
  return { bg: 'linear-gradient(135deg,#8A70D6,#6B52B8)', icon: '📚' }
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
  const topBar = { purple:'#8A70D6', green:'#22C55E', amber:'#F59E0B', blue:'#3B82F6' }[color]
  const iconBg = {
    purple:'bg-[#E9E3FF] text-[#8A70D6]', green:'bg-[#DCFCE7] text-[#16A34A]',
    amber: 'bg-[#FEF3C7] text-[#D97706]', blue: 'bg-[#DBEAFE] text-[#3B82F6]',
  }[color]
  const deltaCls = deltaDir === 'up' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F4F4F6] text-[#8A8888]'
  return (
    <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] relative overflow-hidden" style={{ paddingTop: 3 }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${iconBg}`}>{icon}</div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${deltaCls}`}>{delta}</span>
        </div>
        <div className="text-[28px] font-black leading-none tracking-[-1px] mb-1" style={{ color: '#424040' }}>{value}</div>
        <div className="text-[12px] font-bold" style={{ color: '#8A8888' }}>{label}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Course editor slide-in panel
// ─────────────────────────────────────────────────────────────
function CourseEditor({ course, onClose, onSave }: {
  course: Course | 'new'; onClose: () => void; onSave: () => void
}) {
  const isNew = course === 'new'
  const [aiQuizPrompt, setAiQuizPrompt]     = useState('')
  const [aiLessonPrompt, setAiLessonPrompt] = useState('')
  const [generating, setGenerating]         = useState<'quiz'|'lesson'|null>(null)
  const [pubToggle, setPubToggle]           = useState(!isNew && (course as Course).published)

  const handleGenerate = (type: 'quiz'|'lesson') => {
    setGenerating(type)
    setTimeout(() => {
      setGenerating(null)
      if (type === 'quiz') setAiQuizPrompt('')
      else setAiLessonPrompt('')
    }, 1800)
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 bg-white z-[5000] overflow-y-auto"
      style={{ width: 480, borderLeft: '1px solid #E8E8EC', boxShadow: '0 8px 32px rgba(0,0,0,.12)', animation: 'slideIn .22s ease' }}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Sticky header */}
      <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3.5 z-10"
        style={{ borderBottom: '1px solid #E8E8EC' }}>
        <div className="text-[15px] font-black" style={{ color: '#424040' }}>
          {isNew ? 'New Course' : `Edit: ${(course as Course).title}`}
        </div>
        <button onClick={onClose}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[16px]"
          style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#8A8888' }}>✕</button>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Course title */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Course Title</label>
          <input type="text" defaultValue={isNew ? '' : (course as Course).title}
            placeholder="e.g. Advanced JavaScript"
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }} />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Description</label>
          <textarea defaultValue="A comprehensive introduction with hands-on projects."
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-y"
            style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040', minHeight: 80 }} />
        </div>

        {/* Difficulty + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Difficulty</label>
            <select className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
              style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Status</label>
            <select className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
              style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }}>
              <option>Draft</option><option>Published</option>
            </select>
          </div>
        </div>

        {/* Publish toggle */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg"
          style={{ background: '#F4F4F6' }}>
          <div>
            <div className="text-[13px] font-bold" style={{ color: '#424040' }}>Draft / Publish toggle</div>
            <div className="text-[11px]" style={{ color: '#8A8888' }}>Turn on to publish immediately</div>
          </div>
          <button role="switch" aria-checked={pubToggle} onClick={() => setPubToggle(p => !p)}
            className="relative flex-shrink-0 rounded-full transition-colors duration-200"
            style={{ width: 38, height: 22, background: pubToggle ? '#8A70D6' : '#E8E8EC' }}>
            <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ left: 3, transform: pubToggle ? 'translateX(16px)' : 'translateX(0)' }} />
          </button>
        </div>

        {/* Modules */}
        <div>
          <div className="text-[13px] font-bold mb-2.5" style={{ color: '#424040' }}>Modules (drag to reorder)</div>
          <div className="flex flex-col gap-1.5">
            {[
              { title: 'Module 1: Introduction',       meta: '4 lessons · 1 quiz' },
              { title: 'Module 2: Core Concepts',      meta: '6 lessons · 1 quiz · 1 assignment' },
              { title: 'Module 3: Functions & Scope',  meta: '5 lessons · 1 quiz · 1 assignment' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                style={{ border: '1px solid #E8E8EC', background: '#F4F4F6' }}>
                <span className="text-[14px] cursor-grab" style={{ color: '#BCBBBB' }}>⠿</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold" style={{ color: '#424040' }}>{m.title}</div>
                  <div className="text-[11px]" style={{ color: '#8A8888' }}>{m.meta}</div>
                </div>
                <button className="w-[26px] h-[26px] rounded-md flex items-center justify-center border border-[#E8E8EC] bg-white hover:border-[#8A70D6] hover:bg-[#E9E3FF] transition-all">
                  <Svg size={12}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                </button>
              </div>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-1.5 font-bold text-[12px] text-[#8A70D6] py-2 rounded-lg mt-2"
            style={{ background: '#E9E3FF', border: '1.5px dashed #D4CAF7' }}>
            <Svg size={13}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
            Add module
          </button>
        </div>

        {/* AI Quiz Generator */}
        <div className="rounded-lg p-4" style={{ background: 'linear-gradient(135deg,#8A70D6,#6B52B8)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[16px]">🤖</span>
            <div className="text-[13px] font-bold text-white">AI Quiz Generator</div>
          </div>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,.75)' }}>
            Describe the topic and AI will generate quiz questions for this module.
          </p>
          <div className="flex gap-2">
            <input value={aiQuizPrompt} onChange={e => setAiQuizPrompt(e.target.value)}
              placeholder="e.g. JavaScript closures and scope"
              className="flex-1 rounded-md px-3 py-2 text-[12px] outline-none"
              style={{ border: 'none', background: 'rgba(255,255,255,.9)', color: '#424040' }} />
            <button onClick={() => handleGenerate('quiz')}
              className="px-3 py-2 rounded-md font-bold text-[11px] text-white transition-colors whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)' }}>
              {generating === 'quiz' ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        {/* AI Lesson Assistant */}
        <div className="rounded-lg p-4" style={{ background: '#F4F4F6', border: '1px solid #E8E8EC' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[16px]">📝</span>
            <div className="text-[13px] font-bold" style={{ color: '#424040' }}>AI Lesson Assistant</div>
          </div>
          <p className="text-[12px] mb-3" style={{ color: '#8A8888' }}>
            Generate or improve lesson notes for any topic.
          </p>
          <div className="flex gap-2">
            <input value={aiLessonPrompt} onChange={e => setAiLessonPrompt(e.target.value)}
              placeholder="e.g. Explain JavaScript Promises"
              className="flex-1 rounded-md px-3 py-2 text-[12px] outline-none"
              style={{ border: '1px solid #E8E8EC', background: '#fff', color: '#424040' }} />
            <button onClick={() => handleGenerate('lesson')}
              className="px-3 py-2 rounded-md font-bold text-[11px] text-white transition-colors"
              style={{ background: '#8A70D6' }}>
              {generating === 'lesson' ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onSave}
            className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6B52B8]"
            style={{ background: '#8A70D6' }}>
            Save Changes
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E8E8EC] transition-colors"
            style={{ color: '#424040' }}>
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
    <div className="px-7 py-6 pb-12">

      {/* ── Page header + filter pills ── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-black tracking-tight" style={{ color: '#424040' }}>Courses</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#8A8888' }}>Manage, edit, and publish your courses.</div>
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
                  background:  filter === p.key ? '#8A70D6' : '#fff',
                  color:       filter === p.key ? '#fff'    : '#8A8888',
                  borderColor: filter === p.key ? '#8A70D6' : '#E8E8EC',
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
            style={{ background: '#E9E3FF', border: '1px solid #D4CAF7', color: '#4C3999' }}>
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
            ? (c.avgProgress >= 60 ? '#22C55E' : c.avgProgress >= 40 ? '#8A70D6' : '#8A70D6')
            : '#E8E8EC'

          return (
            <div key={c.id}
              className="bg-white rounded-xl border border-[#E8E8EC] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,.07)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,.10)]">

              {/* Thumbnail */}
              <div className="h-[90px] relative flex items-center justify-center text-[32px]"
                style={{ background: thumb.bg }}>
                {thumb.icon}
                <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: c.published ? '#DCFCE7' : '#F4F4F6',
                    color:      c.published ? '#15803D' : '#8A8888',
                  }}>
                  {c.published ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="text-[13px] font-black leading-snug mb-1" style={{ color: '#424040' }}>{c.title}</div>
                <div className="text-[11px] mb-2.5" style={{ color: '#8A8888' }}>
                  {c.moduleCount} modules · {c.lessonCount} lessons · {c.difficulty}
                </div>

                {c.published ? (
                  <>
                    {/* Stats row */}
                    <div className="flex gap-3 mb-2 text-[11px]" style={{ color: '#8A8888' }}>
                      <span><strong style={{ color: '#424040' }}>{c.enrolled}</strong> enrolled</span>
                      <span>Avg <strong style={{ color: '#424040' }}>{c.avgProgress}%</strong> progress</span>
                      {c.avgQuiz !== null && <span>Quiz avg <strong style={{ color: '#424040' }}>{c.avgQuiz}%</strong></span>}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#F4F4F6' }}>
                      <div className="h-full rounded-full" style={{ width: `${progressBar}%`, background: progressColor }} />
                    </div>
                    <div className="text-[10px] mb-2.5" style={{ color: '#8A8888' }}>
                      {c.avgProgress}% avg completion · {c.fullyCompleted} fully done
                    </div>

                    {/* Per-card AI insight */}
                    <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg mb-3 text-[11px] leading-snug"
                      style={{
                        background:   insight.warn ? '#FEF3C7' : '#E9E3FF',
                        border:       `1px solid ${insight.warn ? '#FDE68A' : '#D4CAF7'}`,
                        color:        insight.warn ? '#92400E' : '#4C3999',
                      }}>
                      <span className="text-[13px] flex-shrink-0">{insight.icon}</span>
                      <span>{insight.text}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditor(c)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-bold bg-[#E9E3FF] text-[#8A70D6] hover:bg-[#D4CAF7] transition-colors">
                        <Svg size={11}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                        Edit
                      </button>
                      <button onClick={() => showToast('Students view opened')}
                        className="flex-1 flex items-center justify-center py-1.5 rounded-md text-[11px] font-bold border border-[#E8E8EC] text-[#424040] hover:border-[#8A70D6] hover:text-[#8A70D6] transition-all">
                        Students
                      </button>
                      <button onClick={() => setConfirm({ msg: `Unpublish "${c.title}"?`, label: 'Unpublish', color: '#F59E0B', cb: () => showToast('Course unpublished') })}
                        className="w-8 h-[30px] flex items-center justify-center rounded-md border border-[#E8E8EC] text-[#8A8888] hover:border-[#F59E0B] hover:bg-[#FEF3C7] transition-all">
                        <Svg size={11}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Draft progress */}
                    <div className="text-[11px] mb-1.5" style={{ color: '#8A8888' }}>Not published yet</div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#F4F4F6' }}>
                      <div className="h-full rounded-full bg-[#E8E8EC]" style={{ width: '40%' }} />
                    </div>

                    {/* Draft actions */}
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditor(c)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-bold bg-[#E9E3FF] text-[#8A70D6] hover:bg-[#D4CAF7] transition-colors">
                        <Svg size={11}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                        Continue editing
                      </button>
                      <button onClick={() => setConfirm({ msg: `Publish "${c.title}" to all students?`, label: 'Publish', color: '#22C55E', cb: () => showToast('Course published ✓') })}
                        className="flex-none px-3 py-1.5 rounded-md text-[11px] font-bold text-white transition-colors"
                        style={{ background: '#22C55E' }}>
                        Publish
                      </button>
                      <button onClick={() => setConfirm({ msg: `Delete "${c.title}"? This cannot be undone.`, label: 'Delete', color: '#EF4444', cb: () => showToast('Draft deleted') })}
                        className="w-8 h-[30px] flex items-center justify-center rounded-md border border-[#E8E8EC] text-[#EF4444] hover:bg-[#FEF2F2] hover:border-[#EF4444] transition-all">
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
          className="rounded-xl border-2 border-dashed border-[#E8E8EC] flex items-center justify-center min-h-[220px] cursor-pointer transition-all hover:border-[#8A70D6] hover:bg-[#E9E3FF]">
          <div className="text-center p-5">
            <div className="w-11 h-11 rounded-xl bg-[#E9E3FF] flex items-center justify-center mx-auto mb-3">
              <Svg size={20} ><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
            </div>
            <div className="text-[13px] font-bold text-[#8A70D6]">Create new course</div>
            <div className="text-[11px] mt-1" style={{ color: '#8A8888' }}>Add modules, lessons, quizzes</div>
          </div>
        </button>
      </div>

      {/* ── Course editor slide-in ── */}
      {editor !== null && (
        <CourseEditor
          course={editor}
          onClose={() => setEditor(null)}
          onSave={() => { setEditor(null); showToast('Course saved ✓') }}
        />
      )}

      {/* ── Confirm dialog ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-white rounded-xl p-7 w-[380px] shadow-2xl" style={{ animation: 'pop .18s ease' }}>
            <style>{`@keyframes pop{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <div className="text-[18px] mb-2">⚠️</div>
            <div className="text-[15px] font-black mb-1.5" style={{ color: '#424040' }}>{confirm.label}?</div>
            <div className="text-[13px] mb-5" style={{ color: '#8A8888' }}>{confirm.msg}</div>
            <div className="flex gap-2.5">
              <button onClick={() => { confirm.cb(); setConfirm(null) }}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white"
                style={{ background: confirm.color }}>
                {confirm.label}
              </button>
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E8E8EC]"
                style={{ color: '#424040' }}>
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
    </div>
  )
}
