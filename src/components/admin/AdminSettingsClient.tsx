// PATH: src/components/admin/AdminSettingsClient.tsx
'use client'

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Settings {
  platformName:         string
  supportEmail:         string
  timezone:             string
  logoUrl:              string
  aiCodingAssistant:    boolean
  aiAssignmentFeedback: boolean
  aiQuizGenerator:      boolean
  aiAtRiskDetection:    boolean
  pointsSystem:         boolean
  badges:               boolean
  leaderboard:          boolean
  emailLiveReminders:   boolean
  emailDeadlines:       boolean
  emailAiRecommend:     boolean
  emailReEngagement:    boolean
  emailNewCourse:       boolean
}

const DEFAULTS: Settings = {
  platformName:'Codentia', supportEmail:'hello@codentia.dev',
  timezone:'Africa/Lagos', logoUrl:'',
  aiCodingAssistant:true, aiAssignmentFeedback:true,
  aiQuizGenerator:true, aiAtRiskDetection:true,
  pointsSystem:true, badges:true, leaderboard:true,
  emailLiveReminders:true, emailDeadlines:true,
  emailAiRecommend:true, emailReEngagement:true, emailNewCourse:true,
}

// ─────────────────────────────────────────────────────────────
// Shared Toggle component
// ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{ width: 38, height: 22, background: checked ? '#8A70D6' : '#E8E8EC' }}>
      <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ left: 3, transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  )
}

function SettingRow({ label, sub, checked, onChange, last = false }: {
  label: string; sub: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3"
      style={{ borderBottom: last ? 'none' : '1px solid #E8E8EC', gap: 16 }}>
      <div>
        <div className="text-[13px] font-bold" style={{ color: '#424040' }}>{label}</div>
        <div className="text-[11px]" style={{ color: '#8A8888' }}>{sub}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-[0_1px_4px_rgba(0,0,0,.07)] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-[#E8E8EC]">
        <div className="text-[14px] font-bold" style={{ color: '#424040' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function Svg({ children, size = 13 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function AdminSettingsClient() {
  const [settings,  setSettings]  = useState<Settings>(DEFAULTS)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')
  const [confirm,   setConfirm]   = useState<{ msg: string; label: string; cb: () => void } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600) }

  // ── Load settings on mount ──────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings({
          platformName:         data.platformName         ?? DEFAULTS.platformName,
          supportEmail:         data.supportEmail         ?? DEFAULTS.supportEmail,
          timezone:             data.timezone             ?? DEFAULTS.timezone,
          logoUrl:              data.logoUrl              ?? '',
          aiCodingAssistant:    data.aiCodingAssistant    ?? true,
          aiAssignmentFeedback: data.aiAssignmentFeedback ?? true,
          aiQuizGenerator:      data.aiQuizGenerator      ?? true,
          aiAtRiskDetection:    data.aiAtRiskDetection    ?? true,
          pointsSystem:         data.pointsSystem         ?? true,
          badges:               data.badges               ?? true,
          leaderboard:          data.leaderboard          ?? true,
          emailLiveReminders:   data.emailLiveReminders   ?? true,
          emailDeadlines:       data.emailDeadlines       ?? true,
          emailAiRecommend:     data.emailAiRecommend     ?? true,
          emailReEngagement:    data.emailReEngagement    ?? true,
          emailNewCourse:       data.emailNewCourse       ?? true,
        })
      })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      showToast('Settings saved ✓')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-7 py-6">
        <div className="text-[13px]" style={{ color: '#8A8888' }}>Loading settings…</div>
      </div>
    )
  }

  return (
    <div className="px-7 py-6 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-black tracking-tight" style={{ color: '#424040' }}>Platform Settings</h1>
          <div className="text-[13px] mt-1" style={{ color: '#8A8888' }}>Configure and control your Codentia platform.</div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold text-[13px] text-white transition-colors hover:bg-[#6B52B8] disabled:opacity-60"
          style={{ background: '#8A70D6' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* General */}
          <Card title="⚙️ General">
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Platform Name</label>
                  <input value={settings.platformName} onChange={e => set('platformName', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }} />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Support Email</label>
                  <input type="email" value={settings.supportEmail} onChange={e => set('supportEmail', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Default Timezone</label>
                <select value={settings.timezone} onChange={e => set('timezone', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
                  style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }}>
                  <option>Africa/Lagos (WAT +1)</option>
                  <option>Europe/London (GMT)</option>
                  <option>America/New_York (EST)</option>
                  <option>America/Los_Angeles (PST)</option>
                  <option>Asia/Dubai (GST +4)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[.5px] block mb-1.5" style={{ color: '#8A8888' }}>Platform Logo URL</label>
                <input type="url" value={settings.logoUrl} onChange={e => set('logoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={{ border: '1px solid #E8E8EC', background: '#F4F4F6', color: '#424040' }} />
              </div>
            </div>
          </Card>

          {/* AI Features */}
          <Card title="🤖 AI Features">
            <div className="px-4 divide-y divide-[#E8E8EC]">
              <SettingRow label="AI Coding Assistant"             sub="Embedded in lesson & assignment pages"              checked={settings.aiCodingAssistant}    onChange={v => set('aiCodingAssistant', v)} />
              <SettingRow label="AI Assignment Feedback"          sub="Instant preliminary feedback before instructor review" checked={settings.aiAssignmentFeedback} onChange={v => set('aiAssignmentFeedback', v)} />
              <SettingRow label="AI Quiz Generator"               sub="Admins can generate quizzes from a prompt"          checked={settings.aiQuizGenerator}      onChange={v => set('aiQuizGenerator', v)} />
              <SettingRow label="AI Student Insights & At-Risk"   sub="Auto-detect struggling students"                    checked={settings.aiAtRiskDetection}    onChange={v => set('aiAtRiskDetection', v)} last />
            </div>
          </Card>

          {/* Gamification */}
          <Card title="🏆 Gamification">
            <div className="px-4 divide-y divide-[#E8E8EC]">
              <SettingRow label="Points System"      sub="Award points for lessons, quizzes, assignments" checked={settings.pointsSystem}  onChange={v => set('pointsSystem', v)} />
              <SettingRow label="Badges & Achievements" sub="Unlock badges on milestones"                 checked={settings.badges}        onChange={v => set('badges', v)} />
              <SettingRow label="Weekly Leaderboard" sub="Show top students by points"                    checked={settings.leaderboard}   onChange={v => set('leaderboard', v)} last />
            </div>
          </Card>

          {/* Email Automation */}
          <Card title="🤖 Email Automation">
            <div className="px-4 divide-y divide-[#E8E8EC]">
              <SettingRow label="Live class reminders (24h, 1h, 10min)" sub="Auto-sent to enrolled students"           checked={settings.emailLiveReminders} onChange={v => set('emailLiveReminders', v)} />
              <SettingRow label="Assignment deadline reminders"          sub="24h before due date"                     checked={settings.emailDeadlines}     onChange={v => set('emailDeadlines', v)} />
              <SettingRow label="AI study recommendations"               sub="Triggered when quiz score < 60%"         checked={settings.emailAiRecommend}   onChange={v => set('emailAiRecommend', v)} />
              <SettingRow label="Re-engagement for inactive students"    sub="After 7 days of inactivity"              checked={settings.emailReEngagement}  onChange={v => set('emailReEngagement', v)} />
              <SettingRow label="New course published"                   sub="Notify all students"                     checked={settings.emailNewCourse}     onChange={v => set('emailNewCourse', v)} last />
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* Roles & Permissions */}
          <Card title="👥 Roles & Permissions">
            <div className="p-4 flex flex-col gap-3">
              <div className="p-3 rounded-lg" style={{ border: '2px solid #8A70D6', background: '#E9E3FF' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-black" style={{ color: '#8A70D6' }}>Super Admin</div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9E3FF] text-[#6B52B8]" style={{ border: '1px solid #D4CAF7' }}>Your role</span>
                </div>
                <div className="text-[11px]" style={{ color: '#6B52B8' }}>Full platform access — create, edit, delete, manage users, all settings</div>
              </div>
              {[
                { title: 'Instructor', perms: ['Create course','Edit lesson','Review assignments'] },
                { title: 'Moderator',  perms: ['View students','Send notifications'] },
              ].map(role => (
                <div key={role.title} className="p-3 rounded-lg" style={{ border: '1px solid #E8E8EC', background: '#F4F4F6' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[13px] font-bold" style={{ color: '#424040' }}>{role.title}</div>
                    <button onClick={() => showToast('Role editor opened')}
                      className="text-[11px] font-bold bg-transparent border-none cursor-pointer" style={{ color: '#8A70D6' }}>
                      Edit →
                    </button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {role.perms.map(p => (
                      <span key={p} className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: role.title === 'Instructor' ? '#E9E3FF' : '#F4F4F6',
                                 color: role.title === 'Instructor' ? '#6B52B8' : '#8A8888',
                                 border: role.title === 'Moderator' ? '1px solid #E8E8EC' : 'none' }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => showToast('New role dialog opened')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-[12px]"
                style={{ background: '#E9E3FF', color: '#8A70D6', border: '1.5px dashed #D4CAF7' }}>
                <Svg><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
                Create New Role
              </button>
            </div>
          </Card>

          {/* Live Class Integration */}
          <Card title="📹 Live Class Integration">
            <div className="p-4 flex flex-col gap-3">
              {[
                { name: 'Zoom',         bg: '#2D8CFF', status: 'Connected', statusColor: '#22C55E', action: 'Configure →' },
                { name: 'Google Meet',  bg: '#00A651', status: 'Not connected', statusColor: '#8A8888', action: 'Connect →' },
              ].map(app => (
                <div key={app.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: '#F4F4F6', border: '1px solid #E8E8EC' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: app.bg }}>
                      <svg style={{ width: 15, height: 15, fill: '#fff' }} viewBox="0 0 24 24">
                        {app.name === 'Zoom'
                          ? <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
                          : <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/>}
                      </svg>
                    </div>
                    <div>
                      <div className="text-[12px] font-bold" style={{ color: '#424040' }}>{app.name}</div>
                      <div className="text-[11px]" style={{ color: app.statusColor }}>
                        {app.status === 'Connected' ? '● ' : ''}{app.status}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => showToast(`${app.name} settings opened`)}
                    className="text-[11px] font-bold cursor-pointer" style={{ color: '#8A70D6', background: 'none', border: 'none' }}>
                    {app.action}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #FECACA' }}>
            <div className="px-4 py-3.5 border-b" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
              <div className="text-[14px] font-bold" style={{ color: '#EF4444' }}>⚠️ Danger Zone</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { label: 'Reset all student progress', sub: 'Cannot be undone', action: 'Reset' },
                { label: 'Delete all student accounts', sub: 'This action is irreversible', action: 'Delete' },
              ].map(z => (
                <div key={z.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: '#424040' }}>{z.label}</div>
                    <div className="text-[11px]" style={{ color: '#8A8888' }}>{z.sub}</div>
                  </div>
                  <button onClick={() => setConfirm({ msg: `${z.label}? This cannot be undone.`, label: z.action, cb: () => showToast(`${z.action} completed`) })}
                    className="px-4 py-1.5 rounded-lg font-bold text-[12px]"
                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                    {z.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-white rounded-xl p-7 w-[380px] shadow-2xl" style={{ animation: 'pop .18s ease' }}>
            <style>{`@keyframes pop{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <div className="text-[18px] mb-2">⚠️</div>
            <div className="text-[15px] font-black mb-1.5" style={{ color: '#424040' }}>{confirm.label}?</div>
            <div className="text-[13px] mb-5" style={{ color: '#8A8888' }}>{confirm.msg}</div>
            <div className="flex gap-2.5">
              <button onClick={() => { confirm.cb(); setConfirm(null) }}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] text-white" style={{ background: '#EF4444' }}>
                {confirm.label}
              </button>
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] border border-[#E8E8EC]" style={{ color: '#424040' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white z-[9999]"
          style={{ background: '#1A1730', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}