// PATH: src/components/dashboard/AIAssistantPanel.tsx
'use client'

import { useState } from 'react'
import { renderMarkdown } from '@/lib/renderMarkdown'

interface Message { role: 'user' | 'assistant'; content: string }
interface Props    { lessonId: string; lessonTitle: string }

export default function AIAssistantPanel({ lessonId, lessonTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function sendMessage() {
    const question = input.trim()
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
    <div className="border border-[#EBEBEB] rounded-[14px] overflow-hidden flex flex-col h-full"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#EBEBEB]"
        style={{ background: 'linear-gradient(135deg,#8A70D6 0%,#6B52B8 100%)' }}>
        <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[14px]">🤖</span>
        <div>
          <p className="font-bold text-white text-[13px]">Codentia AI</p>
          <p className="text-[10px] text-white/70">Ask anything about this lesson</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[13px] text-[#8A8888] mb-4">Ask me anything about <strong>{lessonTitle}</strong>!</p>
            <div className="flex flex-col gap-2">
              {['Can you explain this concept?', 'Help me debug my code', 'Give me a practice example'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-[12px] px-3 py-2 rounded-lg bg-[#F8F6FF] text-[#8A70D6] hover:bg-[#E9E3FF] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-[#8A70D6] text-white rounded-[10px] rounded-tr-[3px] px-3.5 py-2.5 text-[13px] leading-relaxed max-w-[90%]">
                {msg.content}
              </div>
            ) : (
              <div className="bg-[#F8F6FF] border border-[#E8E4F0] rounded-[10px] rounded-tl-[3px] px-3.5 py-2.5 max-w-[90%]">
                {renderMarkdown(msg.content)}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F8F6FF] border border-[#E8E4F0] rounded-[10px] rounded-tl-[3px] px-3.5 py-2.5">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-[#8A70D6] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-[#EBEBEB]">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask a question..."
          className="flex-1 border border-[#EBEBEB] rounded-lg px-3 py-2 text-[13px] outline-none bg-[#FBFBFB] placeholder:text-[#8A8888] focus:border-[#8A70D6] transition-colors"
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
          style={{ background: '#8A70D6' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#6B52B8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#8A70D6')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
