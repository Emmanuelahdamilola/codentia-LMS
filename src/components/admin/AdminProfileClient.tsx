// PATH: src/components/admin/AdminProfileClient.tsx
'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import AvatarUpload  from '@/components/ui/AvatarUpload'

interface User {
  name: string; email: string; image: string | null
  bio: string; timezone: string; memberSince: string; initials: string
}

export default function AdminProfileClient({ user }: { user: User }) {
  const router = useRouter()

  const [form,         setForm]         = useState({ name: user.name, bio: user.bio, timezone: user.timezone })
  const [currentImage, setCurrentImage] = useState<string | null>(user.image)
  const [saving,       setSaving]       = useState(false)
  const [toast,        setToast]        = useState('')
  const [pwForm,       setPwForm]       = useState({ current: '', next: '', confirm: '' })
  const [pwSaving,     setPwSaving]     = useState(false)
  const [pwError,      setPwError]      = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: form.name, bio: form.bio, timezone: form.timezone, image: currentImage }),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast('Profile saved ✓')
      router.refresh()
    } catch { showToast('Failed to save') }
    finally { setSaving(false) }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    if (pwForm.next.length < 8) { setPwError('Minimum 8 characters'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Password changed ✓')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password')
    } finally { setPwSaving(false) }
  }

  const inputCls = "w-full border border-[#E8E8EC] rounded-lg px-3 h-[38px] text-[13px] text-[#1A1523] bg-[#F4F4F6] outline-none focus:border-[#7C5CDB] transition-colors"
  const labelCls = "block text-[11px] font-bold uppercase tracking-[.5px] text-[#9591A8] mb-1.5"

  return (
    <div className="px-7 py-6 pb-12 max-w-[700px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] tracking-tight" style={{ color: '#1A1523' }}>My Profile</h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#9591A8' }}>Manage your admin account details</div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
          style={{ background: '#7C5CDB' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col gap-5">

        {/* Avatar + basic info */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          {/* Purple header strip */}
          <div className="h-20 relative" style={{ background: 'linear-gradient(135deg,#7C5CDB,#6146C4)' }} />

          <div className="px-6 pb-6">
            {/* Avatar positioned over the strip */}
            <div className="relative -mt-10 mb-4 inline-block">
              <AvatarUpload
                currentImage={currentImage}
                initials={user.initials}
                size={80}
                onUpload={url => { setCurrentImage(url); showToast('Photo updated — click Save Changes to confirm') }}
                onError={msg => showToast(msg)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input className={inputCls} value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} value={user.email} disabled
                  style={{ opacity: .6, cursor: 'not-allowed' }} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Bio</label>
                <textarea className={inputCls.replace('h-[38px]', 'min-h-[80px] py-2')}
                  style={{ resize: 'vertical' }}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell students a bit about yourself…" />
              </div>
              <div>
                <label className={labelCls}>Timezone</label>
                <select className={inputCls} value={form.timezone}
                  onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>
                  {['Africa/Lagos','Africa/Nairobi','Africa/Johannesburg',
                    'Europe/London','America/New_York','America/Los_Angeles',
                    'Asia/Dubai','Asia/Singapore'].map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Member Since</label>
                <input className={inputCls} value={user.memberSince} disabled
                  style={{ opacity: .6, cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E8EC]">
            <div className="text-[14px] font-black" style={{ color: '#1A1523' }}>🔒 Change Password</div>
          </div>
          <form onSubmit={handlePasswordChange} className="p-5 flex flex-col gap-3">
            {pwError && (
              <div className="text-[12px] font-bold px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#EF4444]">{pwError}</div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Current Password</label>
                <input type="password" className={inputCls} value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••" required />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" className={inputCls} value={pwForm.next}
                  onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                  placeholder="Min. 8 characters" required />
              </div>
              <div>
                <label className={labelCls}>Confirm New</label>
                <input type="password" className={inputCls} value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••" required />
              </div>
            </div>
            <div>
              <button type="submit" disabled={pwSaving}
                className="px-5 py-2 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6146C4] disabled:opacity-60"
                style={{ background: '#7C5CDB' }}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white z-[9999]"
          style={{ background: '#1A1730', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}