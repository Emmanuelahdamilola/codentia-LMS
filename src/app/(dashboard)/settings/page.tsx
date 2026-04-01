// PATH: src/app/(dashboard)/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { signOut }             from 'next-auth/react'
import { Eye, EyeOff, Loader2, Bell, Globe, Shield, Trash2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange}
      className="relative w-10 h-[22px] rounded-full flex-shrink-0 transition-colors duration-200"
      style={{ background: on ? '#7C5CDB' : '#E9E7EF' }}>
      <span className="absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ left: 3, transform: on ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter()

  // ── Password ─────────────────────────────────────────────
  const [pwForm,    setPwForm]    = useState({ current: '', next: '', confirm: '' })
  const [showPw,    setShowPw]    = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg,     setPwMsg]     = useState<{ type: 'success'|'error'; text: string } | null>(null)

  // ── Notification prefs ────────────────────────────────────
  const [notifs, setNotifs] = useState({
    emailNewLessons:     true,
    emailDeadlines:      true,
    emailClassReminders: true,
    emailAiFeedback:     true,
  })
  const [timezone,      setTimezone]      = useState('Africa/Lagos')
  const [prefsLoading,  setPrefsLoading]  = useState(true)
  const [prefsSaving,   setPrefsSaving]   = useState(false)
  const [prefsMsg,      setPrefsMsg]      = useState('')

  // ── Delete account ────────────────────────────────────────
  const [showDelete,   setShowDelete]   = useState(false)
  const [deletePass,   setDeletePass]   = useState('')
  const [deleteLoading,setDeleteLoading]= useState(false)
  const [deleteMsg,    setDeleteMsg]    = useState('')

  // ── Load preferences on mount ─────────────────────────────
  useEffect(() => {
    fetch('/api/user/preferences')
      .then(r => r.json())
      .then(d => {
        setNotifs({
          emailNewLessons:     d.emailNewLessons     ?? true,
          emailDeadlines:      d.emailDeadlines      ?? true,
          emailClassReminders: d.emailClassReminders ?? true,
          emailAiFeedback:     d.emailAiFeedback     ?? true,
        })
        setTimezone(d.timezone ?? 'Africa/Lagos')
      })
      .catch(() => {})
      .finally(() => setPrefsLoading(false))
  }, [])

  // ── Change password ───────────────────────────────────────
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return
    }
    setPwLoading(true); setPwMsg(null)
    try {
      const res  = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPwMsg({ type: 'success', text: 'Password updated successfully.' })
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' })
    } finally { setPwLoading(false) }
  }

  // ── Save preferences ──────────────────────────────────────
  async function savePreferences() {
    setPrefsSaving(true); setPrefsMsg('')
    try {
      const res = await fetch('/api/user/preferences', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...notifs, timezone }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setPrefsMsg('Preferences saved ✓')
      setTimeout(() => setPrefsMsg(''), 2500)
    } catch {
      setPrefsMsg('Failed to save preferences')
    } finally { setPrefsSaving(false) }
  }

  // ── Delete account ────────────────────────────────────────
  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!deletePass) { setDeleteMsg('Please enter your password to confirm.'); return }
    setDeleteLoading(true); setDeleteMsg('')
    try {
      const res  = await fetch('/api/auth/delete-account', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: deletePass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Sign out to clear the JWT cookie, then redirect
      await signOut({ callbackUrl: '/login?deleted=1' })
    } catch (err) {
      setDeleteMsg(err instanceof Error ? err.message : 'Failed to delete account.')
    } finally { setDeleteLoading(false) }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl">
      <h1 className="text-[22px] font-semibold text-[#1A1523] tracking-tight mb-6" style={{ letterSpacing: "-0.025em" }}>Settings</h1>

      <div className="flex flex-col gap-5">

        {/* ── Change Password ── */}
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-6 shadow-[0_2px_8px_rgba(15,13,26,0.06)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#EDE8FF] flex items-center justify-center">
              <Shield size={14} className="text-[#7C5CDB]" />
            </div>
            <h2 className="text-[14px] font-bold text-[#1A1523]">Change Password</h2>
          </div>

          {pwMsg && (
            <div className={`text-[13px] px-4 py-3 rounded-lg border mb-4 ${
              pwMsg.type === 'success'
                ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D]'
                : 'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]'
            }`}>{pwMsg.text}</div>
          )}

          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            <div>
              <label className="block text-[13px] font-bold text-[#1A1523] mb-1.5">Current Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                  required placeholder="••••••••"
                  className="w-full border border-[#E9E7EF] rounded-lg px-3 pr-10 h-[38px] text-[13px] outline-none bg-[#F7F7F9] text-[#1A1523] focus:border-[#7C5CDB] transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9591A8]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#1A1523] mb-1.5">New Password</label>
              <input type="password" value={pwForm.next}
                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                required placeholder="Min. 8 characters"
                className="w-full border border-[#E9E7EF] rounded-lg px-3 h-[38px] text-[13px] outline-none bg-[#F7F7F9] text-[#1A1523] focus:border-[#7C5CDB] transition-colors" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#1A1523] mb-1.5">Confirm New Password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                required placeholder="••••••••"
                className="w-full border border-[#E9E7EF] rounded-xl border border-[#E9E7EF] rounded-lg px-3 h-[38px] text-[13px] outline-none bg-[#F7F7F9] text-[#1A1523] focus:border-[#7C5CDB] transition-colors" />
            </div>
            <button type="submit" disabled={pwLoading}
              className="flex items-center justify-center gap-2 text-white font-bold text-[13px] px-5 py-2.5 rounded-lg transition-colors hover:bg-[#6146C4] disabled:opacity-60 w-fit"
              style={{ background: '#7C5CDB' }}>
              {pwLoading && <Loader2 size={13} className="animate-spin" />}
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── Notification Preferences ── */}
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-6 shadow-[0_2px_8px_rgba(15,13,26,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EDE8FF] flex items-center justify-center">
                <Bell size={14} className="text-[#7C5CDB]" />
              </div>
              <h2 className="text-[14px] font-bold text-[#1A1523]">Email Notifications</h2>
            </div>
            {prefsMsg && (
              <span className={`text-[12px] font-bold ${prefsMsg.includes('✓') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {prefsMsg}
              </span>
            )}
          </div>

          {prefsLoading ? (
            <div className="text-[13px] text-[#9591A8] py-4">Loading preferences…</div>
          ) : (
            <div className="flex flex-col gap-3">
              {([
                { key: 'emailNewLessons',     label: 'New lessons released',          sub: 'When a new lesson is published' },
                { key: 'emailDeadlines',      label: 'Assignment deadline reminders', sub: '24h before due date' },
                { key: 'emailClassReminders', label: 'Live class reminders',           sub: '24h, 1h, and 10 min before class' },
                { key: 'emailAiFeedback',     label: 'AI & instructor feedback',       sub: 'When your assignment is reviewed' },
              ] as const).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-[#E9E7EF] last:border-0">
                  <div>
                    <div className="text-[13px] font-bold text-[#1A1523]">{label}</div>
                    <div className="text-[11px] text-[#9591A8]">{sub}</div>
                  </div>
                  <Toggle on={notifs[key]} onChange={() => setNotifs(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Preferences ── */}
        <div className="bg-white border border-[#E9E7EF] rounded-2xl p-6 shadow-[0_2px_8px_rgba(15,13,26,0.06)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#EDE8FF] flex items-center justify-center">
              <Globe size={14} className="text-[#7C5CDB]" />
            </div>
            <h2 className="text-[14px] font-bold text-[#1A1523]">Preferences</h2>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#1A1523] mb-1.5">Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full border border-[#E9E7EF] rounded-lg px-3 h-[38px] text-[13px] outline-none bg-[#F7F7F9] text-[#1A1523] focus:border-[#7C5CDB] transition-colors max-w-xs cursor-pointer">
              {['Africa/Lagos','Africa/Nairobi','Africa/Johannesburg','Europe/London','America/New_York',
                'America/Los_Angeles','Asia/Dubai','Asia/Singapore','Australia/Sydney'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#9591A8] mt-1.5">Used for displaying live class times.</p>
          </div>

          <button onClick={savePreferences} disabled={prefsSaving}
            className="mt-4 flex items-center gap-2 text-white font-bold text-[13px] px-5 py-2.5 rounded-lg transition-colors hover:bg-[#6146C4] disabled:opacity-60"
            style={{ background: '#7C5CDB' }}>
            {prefsSaving && <Loader2 size={13} className="animate-spin" />}
            {prefsSaving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-white border border-[#FECACA] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(15,13,26,0.06)]">
          <div className="flex items-center gap-2 px-6 py-4 bg-[#FEF2F2] border-b border-[#FECACA]">
            <Trash2 size={15} className="text-[#DC2626]" />
            <h2 className="text-[14px] font-bold text-[#DC2626]">Danger Zone</h2>
          </div>
          <div className="p-6">
            {!showDelete ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[13px] font-bold text-[#1A1523] mb-1">Delete My Account</div>
                  <div className="text-[12px] text-[#9591A8]">Permanently delete your account and all data. Cannot be undone.</div>
                </div>
                <button onClick={() => setShowDelete(true)}
                  className="flex-shrink-0 px-4 py-2 rounded-lg font-bold text-[12px] text-[#DC2626] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors">
                  Delete Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C]">
                  ⚠️ This will permanently delete your account, all progress, submissions and data.
                </div>
                {deleteMsg && (
                  <div className="text-[12px] font-bold text-[#DC2626]">{deleteMsg}</div>
                )}
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1523] mb-1.5">
                    Confirm your password to continue
                  </label>
                  <input type="password" value={deletePass}
                    onChange={e => setDeletePass(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-[#FECACA] rounded-lg px-3 h-[38px] text-[13px] outline-none bg-[#FEF2F2] text-[#1A1523] focus:border-[#DC2626] transition-colors" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={deleteLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white bg-[#DC2626] hover:bg-[#DC2626] transition-colors disabled:opacity-60">
                    {deleteLoading && <Loader2 size={13} className="animate-spin" />}
                    {deleteLoading ? 'Deleting…' : 'Yes, Delete My Account'}
                  </button>
                  <button type="button" onClick={() => { setShowDelete(false); setDeletePass(''); setDeleteMsg('') }}
                    className="px-5 py-2.5 rounded-lg font-bold text-[13px] text-[#1A1523] border border-[#E9E7EF] bg-white hover:bg-[#F7F7F9] transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}