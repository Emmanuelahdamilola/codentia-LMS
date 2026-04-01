// PATH: src/components/dashboard/AIAssistantPanel.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { renderMarkdown } from '@/lib/renderMarkdown'
import { Send, Sparkles, RotateCcw } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }
interface Props    { lessonId: string; lessonTitle: string }

const SUGGESTIONS = [
  'Can you explain this concept?',
  'Help me debug my code',
  'Give me a practice example',
  'What should I study next?',
]

export default function AIAssistantPanel({ lessonId, lessonTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res  = await fetch('/api/ai/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, lessonId, context: `Lesson: ${lessonTitle}` }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer ?? 'Sorry, I could not generate a response.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-white border border-[#E9E7EF]"
      style={{ boxShadow: '0 2px 8px rgba(15,13,26,0.06)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
        style={{ background: 'linear-gradient(135deg, #7C5CDB 0%, #4F38A8 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-[13px] leading-tight">Codentia AI</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              <p className="text-[10.5px] text-white/65">Ready to help</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150">
            <RotateCcw size={11} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-6 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--color-primary-tint)' }}>
              <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-[13px] font-semibold text-[#1A1523] mb-1">Ask me anything</p>
            <p className="text-[12px] text-[#9591A8] text-center mb-4 max-w-[220px] leading-relaxed">
              I'm here to help you master <strong className="text-[#5A5672]">{lessonTitle}</strong>
            </p>
            <div className="flex flex-col gap-1.5 w-full">
              {SUGGESTIONS.map((s, i) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className={`text-left text-[12.5px] px-3.5 py-2.5 rounded-xl font-medium text-[#7C5CDB] transition-all duration-150 animate-fade-up stagger-${i + 1}`}
                  style={{ background: 'var(--color-primary-faint)', border: '1px solid var(--color-primary-tint)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-tint)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary-faint)'; e.currentTarget.style.borderColor = 'var(--color-primary-tint)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-md text-[13px] leading-relaxed max-w-[88%] text-white font-medium"
                style={{ background: 'linear-gradient(135deg, #7C5CDB, #6146C4)' }}>
                {msg.content}
              </div>
            ) : (
              <div className="flex items-start gap-2.5 max-w-[92%]">
                <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center"
                  style={{ background: 'var(--color-primary-tint)' }}>
                  <Sparkles size={11} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] leading-relaxed"
                  style={{ background: '#F7F7F9', border: '1px solid #E9E7EF', color: '#1A1523' }}>
                  {renderMarkdown(msg.content)}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 animate-fade-up">
            <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: 'var(--color-primary-tint)' }}>
              <Sparkles size={11} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="px-3.5 py-3 rounded-2xl rounded-tl-md"
              style={{ background: '#F7F7F9', border: '1px solid #E9E7EF' }}>
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--color-primary)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: '1px solid #E9E7EF' }}>
        <div className="flex gap-2 items-center bg-[#F7F7F9] rounded-xl px-3 py-1.5 transition-all duration-200"
          style={{ border: '1.5px solid #E9E7EF' }}
          onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-focus)'; (e.currentTarget as HTMLDivElement).style.background = '#fff' }}
          onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E9E7EF'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.background = '#F7F7F9' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask a question..."
            className="flex-1 border-none bg-transparent outline-none text-[13px] py-1"
            style={{ color: '#1A1523', fontFamily: 'var(--font-sans)' }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 disabled:opacity-35 active:scale-95"
            style={{ background: input.trim() ? 'var(--color-primary)' : 'transparent' }}>
            <Send size={13} style={{ color: input.trim() ? '#fff' : '#9591A8' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
