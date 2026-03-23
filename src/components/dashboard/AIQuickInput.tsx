// PATH: src/components/dashboard/AIQuickInput.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AIQuickInput() {
  const [value, setValue] = useState('')
  const router = useRouter()

  const handleSend = () => {
    if (!value.trim()) return
    // Navigate to lessons/AI panel with pre-filled query
    router.push(`/lessons?q=${encodeURIComponent(value.trim())}`)
  }

  return (
    <div className="border-t border-[#EBEBEB] px-4 py-3 flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="Ask Codentia AI..."
        className="flex-1 border border-[#EBEBEB] rounded-md px-2.5 py-[7px] text-[12px] text-[#424040] outline-none bg-[#FBFBFB] focus:border-[#8A70D6] transition-colors placeholder:text-[#8A8888]"
      />
      <button
        onClick={handleSend}
        className="w-[30px] h-[30px] rounded-md bg-[#8A70D6] hover:bg-[#6B52B8] flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none"/>
        </svg>
      </button>
    </div>
  )
}