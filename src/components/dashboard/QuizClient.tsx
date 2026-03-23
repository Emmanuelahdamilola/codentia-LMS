// PATH: src/components/dashboard/QuizClient.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Option   { id: string; text: string; order: number }
interface Question { id: string; question: string; order: number; explanation: string | null; options: Option[] }
interface Quiz     { id: string; title: string; questions: Question[] }

interface Props {
  quiz:          Quiz
  lessonId:      string
  courseId:      string
  totalTimeSecs: number
}

type AnswerState = 'idle' | 'correct' | 'incorrect'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function QuizClient({ quiz, lessonId, courseId, totalTimeSecs }: Props) {
  const router    = useRouter()
  const questions = quiz.questions.slice().sort((a, b) => a.order - b.order)
  const total     = questions.length

  // ── State ─────────────────────────────────────────────────
  const [currentIdx,    setCurrentIdx]    = useState(0)
  const [selections,    setSelections]    = useState<Record<string, number>>({})   // qId → opt.order chosen
  const [submitted,     setSubmitted]     = useState<Record<string, boolean>>({})  // qId → was submit-btn pressed
  const [correctMap,    setCorrectMap]    = useState<Record<string, number>>({})   // qId → correctOption (from API)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [timeLeft,      setTimeLeft]      = useState(totalTimeSecs)
  const [timerRunning,  setTimerRunning]  = useState(true)
  const [phase,         setPhase]         = useState<'quiz' | 'submitting' | 'results'>('quiz')
  const [finalScore,    setFinalScore]    = useState(0)
  const [apiError,      setApiError]      = useState('')

  const currentQ      = questions[currentIdx]
  const selectedOrder = selections[currentQ?.id]
  const isSubmitted   = !!submitted[currentQ?.id]

  // Correct/incorrect only evaluable once API has returned the answer for this question
  const knownCorrect   = correctMap[currentQ?.id]
  const answerState: AnswerState =
    !isSubmitted || knownCorrect === undefined
      ? 'idle'
      : selectedOrder === knownCorrect
        ? 'correct'
        : 'incorrect'

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning || phase !== 'quiz') return
    if (timeLeft <= 0) { handleFinish(); return }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning, timeLeft, phase])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Submit single answer → call API → get correct answer back ──
  async function handleSubmitAnswer() {
    if (isSubmitted || selectedOrder === undefined || submitLoading) return
    setSubmitLoading(true)

    try {
      // Send just this one question's answer so the server can tell us the correct one
      const res  = await fetch('/api/quiz/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quizId: quiz.id, questionId: currentQ.id }),
      })
      const data = await res.json()
      if (res.ok && data.correctOption !== undefined) {
        setCorrectMap(prev => ({ ...prev, [currentQ.id]: data.correctOption }))
      } else {
        // Fallback: mark as submitted without revealing answer (will show on final results)
        setCorrectMap(prev => ({ ...prev, [currentQ.id]: -1 }))
      }
    } catch {
      setCorrectMap(prev => ({ ...prev, [currentQ.id]: -1 }))
    } finally {
      setSubmitted(prev => ({ ...prev, [currentQ.id]: true }))
      setSubmitLoading(false)
    }
  }

  // ── Navigate ──────────────────────────────────────────────
  function goNext() {
    if (currentIdx < total - 1) setCurrentIdx(i => i + 1)
    else handleFinish()
  }
  function goPrev() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1)
  }

  // ── Final submit to API ───────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (phase !== 'quiz') return
    setPhase('submitting')
    setTimerRunning(false)

    try {
      const res  = await fetch('/api/quiz/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quizId: quiz.id, answers: selections }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')

      setFinalScore(data.score)
      // Merge any correct answers the server returned (fills gaps for unanswered questions)
      setCorrectMap(prev => ({ ...prev, ...data.correct }))
      setPhase('results')
      router.refresh()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('quiz')
      setTimerRunning(true)
    }
  }, [phase, quiz.id, selections, router])

  // ── Progress dots ─────────────────────────────────────────
  function DotBar() {
    return (
      <div className="flex items-center justify-between mb-7">
        <span className="text-[13px] font-bold text-[#424040]">
          Question <span className="text-[#8A70D6]">{currentIdx + 1}</span> of {total}
        </span>
        <div className="flex gap-1.5">
          {questions.map((q, i) => {
            const done  = !!submitted[q.id] && correctMap[q.id] !== undefined
            const right = done && selections[q.id] === correctMap[q.id]
            const wrong = done && selections[q.id] !== correctMap[q.id]
            const active = i === currentIdx
            return (
              <div key={q.id} className="h-1.5 w-7 rounded-full transition-all duration-300" style={{
                background: right  ? '#16A34A'
                          : wrong  ? '#DC2626'
                          : active ? '#8A70D6'
                          : i < currentIdx ? '#8A70D6'
                          : '#EBEBEB',
              }} />
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // RESULTS SCREEN
  // ─────────────────────────────────────────────────────────
  if (phase === 'results') {
    const passed       = finalScore >= 60
    const correctCount = Math.round((finalScore / 100) * total)

    return (
      <div>
        {/* Result card */}
        <div className="bg-white border border-[#EBEBEB] rounded-[14px] p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] mb-5">
          <div className="text-[56px] mb-2">{passed ? '🎉' : '📚'}</div>
          <div className="text-[28px] font-black text-[#424040] tracking-tight">{correctCount} / {total} Correct</div>
          <div className="text-[14px] text-[#8A8888] mt-2 mb-6">Score: {finalScore}% · {passed ? 'Passed ✓' : 'Not passed — try again'}</div>

          {passed && (
            <div className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#15803D] rounded-full px-5 py-2 font-bold text-[14px] mb-6">
              ✓ Quiz Passed!
            </div>
          )}

          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              onClick={() => {
                setPhase('quiz'); setCurrentIdx(0); setSelections({})
                setSubmitted({}); setCorrectMap({}); setTimeLeft(totalTimeSecs)
                setTimerRunning(true); setFinalScore(0)
              }}
              className="flex items-center gap-2 bg-[#E9E3FF] text-[#8A70D6] border border-[#D4CAF7] font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-[#8A70D6] hover:text-white transition-all duration-200"
            >
              Review Answers
            </button>
            <Link href={`/courses/${courseId}/learn/${lessonId}`}
              className="flex items-center gap-2 bg-[#8A70D6] text-white font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-[#6B52B8] transition-all duration-200">
              Continue Learning →
            </Link>
          </div>
        </div>

        {/* Per-question review */}
        <div className="flex flex-col gap-3">
          {questions.map((q, qi) => {
            const sel    = selections[q.id]
            const correct = correctMap[q.id]
            const isRight = sel !== undefined && correct !== undefined && sel === correct

            return (
              <div key={q.id} className="bg-white border-[1.5px] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06)]"
                style={{ borderColor: isRight ? '#86EFAC' : '#FCA5A5' }}>
                <div className="flex items-start gap-2.5 mb-4">
                  <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5 ${isRight ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'}`}>
                    {isRight ? '✓' : '✗'}
                  </span>
                  <p className="text-[14px] font-bold text-[#424040] leading-snug">Q{qi + 1}. {q.question}</p>
                </div>

                <div className="flex flex-col gap-2 ml-7">
                  {q.options.slice().sort((a, b) => a.order - b.order).map(opt => {
                    const isCorrectOpt = correct !== undefined && opt.order === correct
                    const isWrongPick  = opt.order === sel && !isRight
                    return (
                      <div key={opt.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] ${isCorrectOpt ? 'bg-[#DCFCE7] text-[#15803D] font-bold' : isWrongPick ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'text-[#8A8888]'}`}>
                        <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold border-[1.5px] ${isCorrectOpt ? 'bg-[#16A34A] border-[#16A34A] text-white' : isWrongPick ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'border-[#EBEBEB] text-[#8A8888]'}`}>
                          {LETTERS[opt.order]}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrectOpt && <span className="text-[11px] font-bold text-[#16A34A] ml-auto">Correct</span>}
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-3 ml-7 bg-[#F8F6FF] border border-[#E9E3FF] rounded-lg px-3 py-2.5 text-[12px] text-[#8A8888] leading-relaxed">
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // SUBMITTING OVERLAY
  // ─────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <svg className="w-8 h-8 animate-spin text-[#8A70D6]" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <p className="text-[14px] font-bold text-[#424040]">Grading your quiz...</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // QUIZ SCREEN
  // ─────────────────────────────────────────────────────────

  return (
    <div>
      <DotBar />

      {apiError && (
        <div className="mb-4 bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-[13px] font-medium px-4 py-3 rounded-lg">
          {apiError}
        </div>
      )}

      {/* Question card */}
      <div className="bg-white border border-[#EBEBEB] rounded-[14px] px-7 py-6 shadow-[0_1px_3px_rgba(0,0,0,.06),0_4px_16px_rgba(0,0,0,.04)] mb-5">
        <p className="text-[17px] font-bold text-[#424040] leading-snug mb-2">{currentQ.question}</p>
        <p className="text-[13px] text-[#8A8888] mb-5">Select the best answer.</p>

        <div className="flex flex-col gap-2.5">
          {currentQ.options.slice().sort((a, b) => a.order - b.order).map(opt => {
            const isSelected   = selectedOrder === opt.order
            const isCorrectOpt = isSubmitted && knownCorrect !== undefined && opt.order === knownCorrect
            const isWrongPick  = isSubmitted && isSelected && answerState === 'incorrect'

            let cls       = 'border-[#EBEBEB] bg-white hover:border-[#A48FE0] hover:bg-[#E9E3FF]'
            let letterCls = 'bg-[#FBFBFB] border-[#EBEBEB] text-[#8A8888]'
            let textCls   = 'text-[#424040]'

            if (!isSubmitted && isSelected) {
              cls       = 'border-[#8A70D6] bg-[#E9E3FF]'
              letterCls = 'bg-[#8A70D6] border-[#8A70D6] text-white'
            }
            if (isCorrectOpt) {
              cls       = 'border-[#16A34A] bg-[#DCFCE7]'
              letterCls = 'bg-[#16A34A] border-[#16A34A] text-white'
              textCls   = 'text-[#15803D] font-bold'
            }
            if (isWrongPick) {
              cls       = 'border-[#DC2626] bg-[#FEE2E2]'
              letterCls = 'bg-[#DC2626] border-[#DC2626] text-white'
              textCls   = 'text-[#B91C1C]'
            }

            return (
              <button key={opt.id}
                disabled={isSubmitted}
                onClick={() => !isSubmitted && setSelections(p => ({ ...p, [currentQ.id]: opt.order }))}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[10px] border-[1.5px] w-full text-left transition-all duration-150 ${cls} disabled:cursor-default`}
              >
                <span className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[13px] border-[1.5px] transition-all ${letterCls}`}>
                  {LETTERS[opt.order]}
                </span>
                <span className={`text-[14px] leading-snug flex-1 ${textCls}`}>{opt.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback banner — only show when we have a definitive answer */}
      {isSubmitted && answerState !== 'idle' && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-[10px] border mb-5"
          style={{ background: answerState === 'correct' ? '#DCFCE7' : '#FEE2E2', borderColor: answerState === 'correct' ? '#86EFAC' : '#FCA5A5' }}>
          <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold mt-0.5 ${answerState === 'correct' ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'}`}>
            {answerState === 'correct' ? '✓' : '✗'}
          </span>
          <div>
            <p className={`text-[13px] font-bold ${answerState === 'correct' ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
              {answerState === 'correct' ? 'Correct! Well done.' : 'Not quite — the correct answer is highlighted in green.'}
            </p>
            {currentQ.explanation && (
              <p className={`text-[13px] mt-1 ${answerState === 'correct' ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                {currentQ.explanation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading state while checking answer */}
      {isSubmitted && answerState === 'idle' && (
        <div className="flex items-center gap-2 px-4 py-3 mb-5">
          <svg className="w-4 h-4 animate-spin text-[#8A70D6]" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-[13px] text-[#8A8888]">Checking answer...</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={currentIdx === 0}
          className="flex items-center gap-1.5 bg-white text-[#424040] border border-[#EBEBEB] font-bold text-[13px] px-5 py-2.5 rounded-lg hover:border-[#8A70D6] hover:text-[#8A70D6] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>

        <div className="flex items-center gap-2">
          {!isSubmitted && (
            <button onClick={handleSubmitAnswer} disabled={selectedOrder === undefined || submitLoading}
              className="bg-[#E9E3FF] text-[#8A70D6] border border-[#D4CAF7] font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-[#8A70D6] hover:text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {submitLoading ? (
                <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Checking…</>
              ) : 'Submit Answer'}
            </button>
          )}

          <button onClick={currentIdx < total - 1 ? goNext : handleFinish}
            disabled={!isSubmitted}
            className="flex items-center gap-1.5 bg-[#8A70D6] text-white font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-[#6B52B8] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
            {currentIdx < total - 1
              ? <>Next <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></>
              : <>Finish Quiz <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></>
            }
          </button>
        </div>
      </div>

      {/* Timer strip */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-1 bg-[#EBEBEB] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / totalTimeSecs) * 100}%`, background: timeLeft < 60 ? '#EF4444' : '#8A70D6' }} />
        </div>
        <span className="text-[12px] font-bold tabular-nums w-10 text-right" style={{ color: timeLeft < 60 ? '#EF4444' : '#8A70D6' }}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  )
}
