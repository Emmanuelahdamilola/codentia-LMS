// PATH: src/components/dashboard/LessonAIPanel.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { renderMarkdown } from '@/lib/renderMarkdown'

interface Message { role: 'user' | 'assistant'; content: string }
interface Props    { lessonId: string; lessonTitle: string }

export default function LessonAIPanel({ lessonId, lessonTitle }: Props) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const question = input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res  = await fetch('/api/ai/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, lessonId, context: `Lesson: ${lessonTitle}` }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer ?? 'Sorry, I could not generate a response.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-[#EBEBEB] rounded-[14px] overflow-hidden mb-6"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)' }}>

      {/* ── Header ── */}
      <button onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        style={{ background: 'linear-gradient(135deg,#8A70D6 0%,#6B52B8 100%)' }}>
        <div className="flex items-center gap-2 text-[13px] font-bold text-white">
          <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[14px]">🤖</span>
          Ask Codentia AI — about this lesson
        </div>
        <svg className="flex-shrink-0 text-white/70 transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', width: 14, height: 14 }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {!collapsed && (
        <>
          {/* ── Messages ── */}
          <div className="flex flex-col gap-3 px-4 py-4 max-h-[480px] overflow-y-auto bg-white">

            {/* Greeting */}
            {messages.length === 0 && (
              <AiBubble>
                <p className="text-[13px] text-[#424040] leading-relaxed">
                  Hi! I&apos;m here to help with <strong>{lessonTitle}</strong>. What would you like to understand better?
                </p>
              </AiBubble>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {msg.role === 'assistant'
                  ? <span className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[12px] mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#8A70D6,#6B52B8)' }}>🤖</span>
                  : <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#6B52B8,#8A70D6)' }}>Me</span>
                }

                {/* Bubble */}
                {msg.role === 'user' ? (
                  <div className="bg-[#8A70D6] text-white rounded-[10px] rounded-tr-[3px] px-3.5 py-2.5 text-[13px] leading-relaxed"
                    style={{ maxWidth: 'calc(100% - 40px)' }}>
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-[#FBFBFB] border border-[#EBEBEB] rounded-[10px] rounded-tl-[3px] px-3.5 py-2.5"
                    style={{ maxWidth: 'calc(100% - 40px)' }}>
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <AiBubble>
                <div className="flex items-center gap-1 py-0.5">
                  {[0, 1, 2].map(j => (
                    <span key={j} className="w-1.5 h-1.5 rounded-full bg-[#8A70D6] animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }} />
                  ))}
                </div>
              </AiBubble>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input row ── */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[#EBEBEB] bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Ask anything about ${lessonTitle}...`}
              className="flex-1 border border-[#EBEBEB] rounded-lg px-3 py-2 text-[13px] text-[#424040] outline-none bg-[#FBFBFB] placeholder:text-[#8A8888] focus:border-[#8A70D6] transition-colors"
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
              style={{ background: '#8A70D6' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6B52B8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#8A70D6')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Small layout helper so the AI avatar + bubble pattern isn't repeated
function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[12px] mt-0.5"
        style={{ background: 'linear-gradient(135deg,#8A70D6,#6B52B8)' }}>🤖</span>
      <div className="bg-[#FBFBFB] border border-[#EBEBEB] rounded-[10px] rounded-tl-[3px] px-3.5 py-2.5"
        style={{ maxWidth: 'calc(100% - 40px)' }}>
        {children}
      </div>
    </div>
  )
}
