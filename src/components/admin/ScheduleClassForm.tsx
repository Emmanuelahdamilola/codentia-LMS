'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Course { id: string; title: string }

export default function ScheduleClassForm({ courses }: { courses: Course[] }) {
  const [form, setForm] = useState({
    courseId: courses[0]?.id ?? '',
    title: '', instructor: 'Codentia Team',
    date: '', time: '', durationMins: 60,
    meetingLink: '',
    reminders: { h24: true, h1: true, min10: true },
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`)
      const res = await fetch('/api/admin/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, scheduledAt }),
      })
      if (res.ok) {
        setSuccess(true)
        setForm(p => ({ ...p, title: '', date: '', time: '', meetingLink: '' }))
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
          ✓ Class scheduled! Reminders will be sent automatically.
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1">Course</label>
        <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
          className="input text-sm" required>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1">Class Title</label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. JavaScript Functions" required className="input text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1">Instructor</label>
        <input value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))}
          required className="input text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-[#1A1523] mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            required className="input text-sm" min={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1A1523] mb-1">Time</label>
          <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
            required className="input text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1">Duration</label>
        <select value={form.durationMins} onChange={e => setForm(p => ({ ...p, durationMins: Number(e.target.value) }))}
          className="input text-sm">
          {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1">Zoom / Meet Link</label>
        <input type="url" value={form.meetingLink} onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))}
          placeholder="https://meet.google.com/..." required className="input text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1523] mb-1.5">Email Reminders</label>
        <div className="space-y-1.5">
          {[
            { key: 'h24', label: '24 hours before' },
            { key: 'h1', label: '1 hour before' },
            { key: 'min10', label: '10 minutes before' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={form.reminders[key as keyof typeof form.reminders]}
                onChange={e => setForm(p => ({ ...p, reminders: { ...p.reminders, [key]: e.target.checked } }))}
                className="w-3.5 h-3.5 accent-[#7C5CDB]" />
              <span className="text-xs text-[#1A1523]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2 mt-1">
        {loading && <Loader2 size={13} className="animate-spin" />}
        {loading ? 'Scheduling...' : 'Schedule Class'}
      </button>
    </form>
  )
}