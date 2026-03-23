// PATH: src/components/dashboard/ProfileClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  name: string; email: string; bio: string; timezone: string
  memberSince: string; initials: string; image: string | null
}
interface Stats {
  lessonsCompleted: number; quizzesPassed: number
  assignmentsDone: number; liveAttended: number; streak: number
}
interface CourseRow { courseId: string; courseTitle: string; percentage: number }

interface Props { user: UserData; stats: Stats; enrolledCourses: CourseRow[] }

function getCourseIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css')) return '🌐'
  if (t.includes('javascript') || t.includes('js')) return '⚡'
  if (t.includes('react')) return '⚛️'
  if (t.includes('python')) return '🐍'
  return '📚'
}
function getCourseBar(title: string) {
  const t = title.toLowerCase()
  if (t.includes('html') || t.includes('css')) return 'linear-gradient(to right,#FF6B35,#F7931E)'
  if (t.includes('react')) return 'linear-gradient(to right,#61DAFB,#21A1C4)'
  return 'linear-gradient(to right,#8A70D6,#6B52B8)'
}

// Section icon helper
function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-7 h-7 rounded-lg bg-[#E9E3FF] flex items-center justify-center flex-shrink-0">
      {children}
    </span>
  )
}

// Toggle switch
function Toggle({ id, defaultChecked }: { id: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked)
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn(p => !p)}
      className="relative w-[42px] h-[24px] rounded-full flex-shrink-0 transition-colors duration-200"
      style={{ background: on ? '#8A70D6' : '#EBEBEB' }}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ left: 3, transform: on ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

// Password strength
function PwStrength({ value }: { value: string }) {
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const levels = [
    { pct: '0%',   color: '#EBEBEB', label: 'Enter a new password', labelColor: '#8A8888' },
    { pct: '25%',  color: '#EF4444', label: 'Weak',    labelColor: '#EF4444' },
    { pct: '50%',  color: '#F59E0B', label: 'Fair',    labelColor: '#F59E0B' },
    { pct: '75%',  color: '#3B82F6', label: 'Good',    labelColor: '#3B82F6' },
    { pct: '100%', color: '#22C55E', label: 'Strong',  labelColor: '#22C55E' },
  ]
  const { pct, color, label, labelColor } = levels[score]
  return (
    <div>
      <div className="h-1 bg-[#EBEBEB] rounded-full overflow-hidden mt-1.5">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: pct, background: color }} />
      </div>
      <div className="text-[11px] mt-1" style={{ color: labelColor }}>{value ? label : levels[0].label}</div>
    </div>
  )
}

export default function ProfileClient({ user, stats, enrolledCourses }: Props) {
  const router = useRouter()

  // Edit mode state
  const [editing,   setEditing]   = useState(false)
  const [form, setForm]           = useState({ name: user.name, bio: user.bio, timezone: user.timezone })
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  // Skills
  const [skills, setSkills] = useState(['HTML','CSS','JavaScript','React','Git','Figma'])
  const [newSkill, setNewSkill] = useState('')

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword,    setDeletePassword]    = useState('')
  const [deleteLoading,     setDeleteLoading]     = useState(false)
  const [deleteError,       setDeleteError]       = useState('')

  async function handleDeleteAccount() {
    if (!deletePassword) { setDeleteError('Please enter your password.'); return }
    setDeleteLoading(true); setDeleteError('')
    try {
      const res  = await fetch('/api/auth/delete-account', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      router.push('/login?deleted=1')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  async function saveProfile() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await fetch('/api/auth/update-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: form.name, bio: form.bio, timezone: form.timezone }),
      })
      setEditing(false)
      showToast('✓ Profile saved successfully')
      router.refresh()
    } catch { showToast('Failed to save.') }
    finally  { setSaving(false) }
  }

  async function changePassword() {
    setPwError('')
    if (!pwForm.current || !pwForm.newPw)  return setPwError('All password fields are required.')
    if (pwForm.newPw !== pwForm.confirm)   return setPwError('New passwords do not match.')
    if (pwForm.newPw.length < 8)           return setPwError('Password must be at least 8 characters.')
    setPwLoading(true)
    try {
      const res  = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      })
      const data = await res.json()
      if (!res.ok) { setPwError(data.error ?? 'Failed'); return }
      setPwForm({ current: '', newPw: '', confirm: '' })
      showToast('✓ Password changed successfully')
    } catch { setPwError('Something went wrong.') }
    finally { setPwLoading(false) }
  }

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border border-[#EBEBEB] rounded-[14px] p-5 mb-4 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] ${className}`}>
      {children}
    </div>
  )

  const CardTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-[14px] font-bold text-[#424040] mb-4">
      <SectionIcon>{icon}</SectionIcon>
      {children}
    </div>
  )

  const inputCls = "w-full border border-[#EBEBEB] rounded-md px-3 py-2 text-[13px] text-[#424040] bg-[#FBFBFB] outline-none focus:border-[#8A70D6] transition-colors placeholder:text-[#8A8888]"
  const labelCls = "text-[11px] font-bold text-[#8A8888] uppercase tracking-[.5px] mb-1 block"

  return (
    <div className="p-7">
      <div className="flex min-h-0" style={{ gap: 24 }}>

        {/* ══ Left / Main ═════════════════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* Profile Header Card */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] mb-4 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)]">
            {/* Cover */}
            <div className="h-[90px] relative" style={{ background: 'linear-gradient(135deg,#8A70D6 0%,#6B52B8 60%,#4F3B8C 100%)' }}>
              <button className="absolute bottom-2 right-3 bg-black/30 text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                Change Cover
              </button>
            </div>

            {/* Avatar + info */}
            <div className="flex items-start pr-6">
              <div className="relative -mt-9 ml-6 inline-block">
                <div className="w-[72px] h-[72px] rounded-full border-3 border-white flex items-center justify-center font-black text-[24px] text-white" style={{ background: 'linear-gradient(135deg,#8A70D6,#6B52B8)', borderWidth: 3 }}>
                  {user.image
                    ? <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    : user.initials}
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-[#22C55E] border-2 border-white" />
              </div>

              <div className="flex-1 flex items-end justify-between px-4 pt-3 pb-4 min-w-0">
                <div className="min-w-0">
                  <div className="text-[18px] font-black text-[#424040] tracking-tight">
                    {editing ? form.name : user.name}
                  </div>
                  <div className="text-[12px] text-[#8A8888] mt-0.5">
                    @{user.name.toLowerCase().replace(/\s+/g, '.')} · Joined {user.memberSince}
                  </div>
                  <div className="text-[13px] text-[#8A8888] mt-1 max-w-md">
                    {editing ? form.bio : (user.bio || 'No bio yet.')}
                  </div>
                </div>

                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-shrink-0 bg-[#E9E3FF] text-[#8A70D6] font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-[#8A70D6] hover:text-white transition-all duration-150"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(false)} className="bg-[#FBFBFB] text-[#8A8888] font-bold text-[13px] px-4 py-2 rounded-lg border border-[#EBEBEB] hover:text-[#424040] transition-colors">Cancel</button>
                    <button onClick={saveProfile} disabled={saving} className="bg-[#8A70D6] text-white font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-[#6B52B8] transition-colors disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VIEW mode */}
          {!editing && (
            <>
              {/* Personal Info (view) */}
              <Card>
                <CardTitle icon={<svg className="w-3.5 h-3.5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>Personal Information</CardTitle>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  {[
                    { label: 'Full Name',  value: user.name  },
                    { label: 'Email',      value: user.email },
                    { label: 'Location',   value: 'Lagos, Nigeria' },
                    { label: 'Timezone',   value: form.timezone },
                    { label: 'Bio', value: user.bio || '—', full: true },
                  ].map(f => (
                    <div key={f.label} className={f.full ? 'col-span-2' : ''}>
                      <div className={labelCls}>{f.label}</div>
                      <div className="text-[13px] text-[#424040]">{f.value}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Skills */}
              <Card>
                <CardTitle icon={<svg className="w-3.5 h-3.5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}>Skills &amp; Interests</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#E9E3FF] text-[#8A70D6]">{s}</span>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* EDIT mode */}
          {editing && (
            <>
              {/* Personal Info (edit) */}
              <Card>
                <CardTitle icon={<svg className="w-3.5 h-3.5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>Personal Information</CardTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
                  <div><label className={labelCls}>Email</label><input className={inputCls} value={user.email} disabled style={{ opacity: .6, cursor: 'not-allowed' }} /></div>
                  <div>
                    <label className={labelCls}>Timezone</label>
                    <select className={inputCls} value={form.timezone} onChange={e => setForm(p => ({...p, timezone: e.target.value}))} style={{ cursor: 'pointer' }}>
                      {['Africa/Lagos','Africa/Nairobi','Africa/Johannesburg','Europe/London','America/New_York','America/Los_Angeles','Asia/Dubai','Asia/Singapore'].map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2"><label className={labelCls}>Bio</label><textarea className={inputCls} rows={3} style={{ resize: 'vertical' }} value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} /></div>
                </div>
              </Card>

              {/* Skills (edit) */}
              <Card>
                <CardTitle icon={<svg className="w-3.5 h-3.5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}>Skills &amp; Interests</CardTitle>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#E9E3FF] text-[#8A70D6]">
                      {s}
                      <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="text-[#8A70D6] hover:text-[#EF4444] leading-none text-[14px]">×</button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newSkill.trim()) { setSkills(p => [...p, newSkill.trim()]); setNewSkill('') }}}
                      placeholder="+ Add skill" className="border-[1.5px] border-dashed border-[#D4CAF7] rounded-full px-3 py-1 text-[12px] font-bold text-[#8A8888] outline-none focus:border-[#8A70D6] focus:text-[#8A70D6] bg-transparent w-28" />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Notification Settings */}
          <Card>
            <CardTitle icon={<svg className="w-3.5 h-3.5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}>Notification Settings</CardTitle>
            {[
              { label: 'Email Notifications',    desc: 'Receive learning updates and reminders via email', default: true },
              { label: 'Live Class Reminders',   desc: 'Get notified 15 minutes before a live session',    default: true },
              { label: 'Assignment Deadlines',   desc: 'Alerts when an assignment is due in 24 hours',     default: true },
              { label: 'Weekly Progress Report', desc: 'Sunday summary of your learning activity',          default: false },
            ].map((s, i) => (
              <div key={s.label} className={`flex items-center justify-between py-2.5 ${i < 3 ? 'border-b border-[#EBEBEB]' : ''}`}>
                <div>
                  <div className="text-[13px] font-bold text-[#424040]">{s.label}</div>
                  <div className="text-[11px] text-[#8A8888] mt-0.5">{s.desc}</div>
                </div>
                <Toggle id={`toggle-${i}`} defaultChecked={s.default} />
              </div>
            ))}
          </Card>

          {/* Change Password */}
          <Card>
            <CardTitle icon={<svg className="w-3.5 h-3.5 text-[#8A70D6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}>Change Password</CardTitle>
            {pwError && <div className="mb-3 bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-[12px] font-medium px-3 py-2 rounded-lg">{pwError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={labelCls}>Current Password</label><input type="password" className={inputCls} placeholder="Enter current password" value={pwForm.current} onChange={e => setPwForm(p => ({...p, current: e.target.value}))} /></div>
              <div><label className={labelCls}>New Password</label><input type="password" className={inputCls} placeholder="New password" value={pwForm.newPw} onChange={e => setPwForm(p => ({...p, newPw: e.target.value}))} /></div>
              <div><label className={labelCls}>Confirm Password</label><input type="password" className={inputCls} placeholder="Repeat new password" value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} /></div>
              <div className="col-span-2"><PwStrength value={pwForm.newPw} /></div>
            </div>
            <button onClick={changePassword} disabled={pwLoading} className="mt-3 bg-[#8A70D6] text-white font-bold text-[13px] px-5 py-2 rounded-lg hover:bg-[#6B52B8] transition-colors disabled:opacity-60">
              {pwLoading ? 'Changing…' : 'Change Password'}
            </button>
          </Card>

          {/* Danger Zone */}
          <div className="bg-white border border-[#FECACA] rounded-[14px] px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="text-[13px] font-bold text-[#EF4444] mb-1">⚠️ Danger Zone</div>
            <div className="text-[12px] text-[#8A8888] mb-3">Permanently delete your account and all associated data. This action cannot be undone.</div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all"
              >
                Delete My Account
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {deleteError && <div className="text-[12px] font-bold text-[#EF4444]">{deleteError}</div>}
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full border border-[#FECACA] rounded-lg px-3 h-[36px] text-[13px] outline-none bg-[#FEF2F2] text-[#424040] focus:border-[#EF4444] transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="bg-[#EF4444] text-white font-bold text-[12px] px-4 py-2 rounded-lg hover:bg-[#DC2626] transition-colors disabled:opacity-60"
                  >
                    {deleteLoading ? 'Deleting…' : 'Yes, Delete Account'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError('') }}
                    className="bg-white text-[#424040] font-bold text-[12px] px-4 py-2 rounded-lg border border-[#EBEBEB] hover:bg-[#F4F4F6] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ Right column ════════════════════════════════════ */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* Learning Summary */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="px-4 py-3.5 border-b border-[#EBEBEB]">
              <span className="text-[13px] font-bold text-[#424040]">Learning Summary</span>
            </div>
            <div className="px-4 py-2">
              {[
                { label: 'Lessons completed',    value: stats.lessonsCompleted },
                { label: 'Quizzes passed',        value: stats.quizzesPassed },
                { label: 'Assignments done',      value: stats.assignmentsDone },
                { label: 'Live classes attended', value: stats.liveAttended },
                { label: 'Current streak',        value: stats.streak > 0 ? `🔥 ${stats.streak} days` : '0 days', amber: stats.streak > 0 },
              ].map((s, i, arr) => (
                <div key={s.label} className={`flex items-center justify-between py-2 text-[13px] ${i < arr.length - 1 ? 'border-b border-[#EBEBEB]' : ''}`}>
                  <span className="text-[#8A8888]">{s.label}</span>
                  <span className={`font-bold ${s.amber ? 'text-[#F59E0B]' : 'text-[#424040]'}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="px-4 py-3.5 border-b border-[#EBEBEB]">
              <span className="text-[13px] font-bold text-[#424040]">Enrolled Courses</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-3">
              {enrolledCourses.length === 0 ? (
                <p className="text-[13px] text-[#8A8888] py-2">No courses enrolled yet.</p>
              ) : (
                enrolledCourses.map(c => (
                  <div key={c.courseId}>
                    <div className="text-[12px] font-bold text-[#424040] mb-1">{getCourseIcon(c.courseTitle)} {c.courseTitle}</div>
                    <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, background: getCourseBar(c.courseTitle) }} />
                    </div>
                    <div className="text-[10px] text-[#8A8888] text-right mt-0.5">{c.percentage}% complete</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account */}
          <div className="bg-white border border-[#EBEBEB] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <div className="px-4 py-3.5 border-b border-[#EBEBEB]">
              <span className="text-[13px] font-bold text-[#424040]">Account</span>
            </div>
            <div className="px-4 py-2">
              {[
                { label: 'Plan',           value: 'Pro Student', color: 'text-[#8A70D6]' },
                { label: 'Member since',   value: user.memberSince },
                { label: 'Account status', value: '● Active', color: 'text-[#22C55E]' },
              ].map((s, i) => (
                <div key={s.label} className={`flex items-center justify-between py-2 text-[13px] ${i < 2 ? 'border-b border-[#EBEBEB]' : ''}`}>
                  <span className="text-[#8A8888]">{s.label}</span>
                  <span className={`font-bold ${s.color ?? 'text-[#424040]'}`}>{s.value}</span>
                </div>
              ))}
              <div className="mt-3">
                <button className="w-full py-2 rounded-md bg-[#E9E3FF] text-[#8A70D6] font-bold text-[12px] hover:bg-[#8A70D6] hover:text-white transition-colors">
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#22C55E] text-white font-bold text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 transition-all">
          {toast}
        </div>
      )}
    </div>
  )
}