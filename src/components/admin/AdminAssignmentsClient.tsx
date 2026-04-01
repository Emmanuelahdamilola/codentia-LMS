'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SubmissionRow {
  id: string
  studentName: string
  studentEmail: string
  assignmentTitle: string
  courseTitle: string
  githubUrl: string | null
  liveUrl: string | null
  notes: string | null
  status: string
  grade: number | null
  feedback: string | null
  submittedAt: string
  daysAgo: number
  isLate: boolean
}

interface AssignmentRow {
  id: string
  title: string
  description: string
  dueDate: string | null
  maxScore: number
  lessonId: string
  lessonTitle: string
  courseTitle: string
  courseId: string
  submissions: number
  createdAt: string
}

interface Stats {
  pending: number
  reviewed: number
  late: number
  reviewedThisWeek: number
}

interface Props {
  submissions: SubmissionRow[]
  stats: Stats
  assignments: AssignmentRow[]
}

const statusBadge: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pending',   bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  PASS:    { label: 'Passed',    bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  FAIL:    { label: 'Failed',    bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
}
const defaultBadge = { label: 'Unknown', bg: '#F4F4F6', text: '#9591A8', dot: '#C0BCCD' }

function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {children}
    </svg>
  )
}

function StatCard({ color, icon, value, label, index }: { color: 'purple'|'green'|'amber'|'red'; icon: React.ReactNode; value: string|number; label: string; index: number }) {
  const topBar = { purple:'#7C5CDB', green:'#22C55E', amber:'#F59E0B', red:'#EF4444' }[color]
  const iconBg = {
    purple:'bg-[#EAE4FF] text-[#7C5CDB]', green:'bg-[#DCFCE7] text-[#16A34A]',
    amber:'bg-[#FEF3C7] text-[#D97706]',  red:'bg-[#FEE2E2] text-[#EF4444]',
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl border border-[#E9E7EF] relative overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,.07)', paddingTop: 3 }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: topBar }} />
      <div className="p-[18px] pt-[15px]">
        <div className="flex items-start justify-between mb-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        </div>
        <div className="text-[28px] font-bold leading-none tracking-tight mb-1 text-[#1A1523]">{value}</div>
        <div className="text-[12px] font-medium text-[#9591A8]">{label}</div>
      </div>
    </motion.div>
  )
}

export default function AdminAssignmentsClient({ submissions, stats, assignments }: Props) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'assignments'>('submissions')
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600) }

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1A1523]">Assignments & Reviews</h1>
          <div className="text-[13px] mt-0.5 text-[#9591A8]">
            Manage assignments and grade student submissions
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard index={0} color="amber" value={stats.pending} label="Pending Review" icon={<Svg><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>} />
        <StatCard index={1} color="green" value={stats.reviewed} label="Total Reviewed" icon={<Svg><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>} />
        <StatCard index={2} color="red" value={stats.late} label="Late Submissions" icon={<Svg><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Svg>} />
        <StatCard index={3} color="purple" value={stats.reviewedThisWeek} label="Reviewed This Week" icon={<Svg><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>} />
      </div>

      <div className="flex gap-4 mb-5 border-b border-[#E9E7EF]">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 font-bold text-[13px] transition-colors relative ${activeTab === 'submissions' ? 'text-[#7C5CDB]' : 'text-[#9591A8] hover:text-[#1A1523]'}`}
        >
          Submissions ({submissions.length})
          {activeTab === 'submissions' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CDB]" />}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 font-bold text-[13px] transition-colors relative ${activeTab === 'assignments' ? 'text-[#7C5CDB]' : 'text-[#9591A8] hover:text-[#1A1523]'}`}
        >
          Manage Assignments ({assignments.length})
          {activeTab === 'assignments' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CDB]" />}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E9E7EF] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
        {activeTab === 'submissions' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E9E7EF]">
                  {['Student', 'Assignment', 'Status', 'Submitted', 'Links', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wide px-4 py-2.5 text-[#9591A8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[13px] text-[#9591A8]">No submissions found.</td></tr>
                ) : submissions.map((s, idx) => {
                  const badge = statusBadge[s.status] || defaultBadge
                  return (
                    <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border-b border-[#E9E7EF] last:border-0 hover:bg-[#F8F6FF] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-bold text-[#1A1523]">{s.studentName}</div>
                        <div className="text-[11px] text-[#9591A8]">{s.studentEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-bold text-[#1A1523]">{s.assignmentTitle}</div>
                        <div className="text-[11px] text-[#7C5CDB]">{s.courseTitle}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.text }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: badge.dot }} />
                          {badge.label}
                        </span>
                        {s.isLate && <span className="ml-2 text-[10px] font-bold text-[#EF4444] bg-[#FEE2E2] px-1.5 py-0.5 rounded">LATE</span>}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#9591A8]">
                        {s.daysAgo === 0 ? 'Today' : `${s.daysAgo}d ago`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-[#1A1523] bg-[#F4F4F6] px-2 py-1 rounded hover:bg-[#E9E7EF]">GitHub</a>}
                          {s.liveUrl && <a href={s.liveUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-[#1A1523] bg-[#F4F4F6] px-2 py-1 rounded hover:bg-[#E9E7EF]">Live</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => showToast('Review modal not implemented yet')} className="text-[12px] font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#7C5CDB,#6347C7)' }}>
                          {s.status === 'PENDING' ? 'Grade' : 'View'}
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E9E7EF]">
                  {['Title', 'Course / Lesson', 'Due Date', 'Max Score', 'Submissions', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wide px-4 py-2.5 text-[#9591A8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[13px] text-[#9591A8]">No assignments found.</td></tr>
                ) : assignments.map((a, idx) => (
                  <motion.tr key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border-b border-[#E9E7EF] last:border-0 hover:bg-[#F8F6FF] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-bold text-[#1A1523]">{a.title}</div>
                      <div className="text-[11px] text-[#9591A8] truncate max-w-[200px]">{a.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-bold text-[#7C5CDB] bg-[#EAE4FF] px-2 py-0.5 rounded inline-block mb-1">{a.courseTitle}</div>
                      <div className="text-[12px] text-[#1A1523]">{a.lessonTitle}</div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9591A8]">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-[#1A1523]">{a.maxScore}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-[#1A1523]">{a.submissions}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => showToast('Edit assignment')} className="text-[#9591A8] hover:text-[#7C5CDB]"><Svg size={14}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg></button>
                        <button onClick={() => showToast('Delete assignment')} className="text-[#9591A8] hover:text-[#EF4444]"><Svg size={14}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-7 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-white z-[9999] flex items-center gap-2"
            style={{ background: '#1A1523', boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}
          >
            <span className="text-[#7C5CDB]">✓</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}