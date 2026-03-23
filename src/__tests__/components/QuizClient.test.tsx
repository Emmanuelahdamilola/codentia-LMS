// PATH: src/__tests__/components/QuizClient.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import QuizClient from '@/components/dashboard/QuizClient'

// ── Mock Next.js router (required — Jest has no App Router context) ──
const mockPush    = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push:    mockPush,
    refresh: mockRefresh,
    back:    jest.fn(),
    forward: jest.fn(),
  }),
}))

// ── Mock fetch (used by submitQuiz) ──────────────────────────
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok:   true,
    json: () => Promise.resolve({ score: 100, correct: { q1: 1 } }),
  })
) as jest.Mock

// ── Test data ────────────────────────────────────────────────
const mockQuiz = {
  id:    'quiz-1',
  title: 'JavaScript Variables Quiz',
  questions: [
    {
      id:          'q1',
      question:    'Which keyword declares a block-scoped variable?',
      order:       1,
      explanation: 'let is block-scoped.',
      options: [
        { id: 'o1', text: 'var',   order: 0 },
        { id: 'o2', text: 'let',   order: 1 },
        { id: 'o3', text: 'const', order: 2 },
        { id: 'o4', text: 'def',   order: 3 },
      ],
    },
  ],
}

// ── Reset mocks between tests ─────────────────────────────────
beforeEach(() => {
  mockPush.mockClear()
  mockRefresh.mockClear()
  ;(global.fetch as jest.Mock).mockClear()
})

// ── Tests ─────────────────────────────────────────────────────
describe('QuizClient', () => {
  it('renders quiz title and questions', () => {
    render(<QuizClient quiz={mockQuiz} lessonId="lesson-1" courseId="course-1" totalTimeSecs={300} />)
    expect(screen.getByText('JavaScript Variables Quiz')).toBeInTheDocument()
    expect(screen.getByText(/Which keyword declares/)).toBeInTheDocument()
  })

  it('shows all answer options', () => {
    render(<QuizClient quiz={mockQuiz} lessonId="lesson-1" courseId="course-1" totalTimeSecs={300} />)
    expect(screen.getByText('var')).toBeInTheDocument()
    expect(screen.getByText('let')).toBeInTheDocument()
    expect(screen.getByText('const')).toBeInTheDocument()
    expect(screen.getByText('def')).toBeInTheDocument()
  })

  it('submit button is disabled until all questions answered', () => {
    render(<QuizClient quiz={mockQuiz} lessonId="lesson-1" courseId="course-1" totalTimeSecs={300} />)
    const submitBtn = screen.getByRole('button', { name: /submit quiz/i })
    expect(submitBtn).toBeDisabled()
  })

  it('enables submit after selecting an answer', () => {
    render(<QuizClient quiz={mockQuiz} lessonId="lesson-1" courseId="course-1" totalTimeSecs={300} />)
    fireEvent.click(screen.getByText('let'))
    const submitBtn = screen.getByRole('button', { name: /submit quiz/i })
    expect(submitBtn).not.toBeDisabled()
  })

  it('highlights selected answer', () => {
    render(<QuizClient quiz={mockQuiz} lessonId="lesson-1" courseId="course-1" totalTimeSecs={300} />)
    const option = screen.getByText('let')
    fireEvent.click(option)
    expect(option.closest('button')).toHaveClass('border-[#8A70D6]')
  })
})