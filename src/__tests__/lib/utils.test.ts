// PATH: src/__tests__/lib/progress.test.ts
import { toPercent } from '@/lib/utils'

// ─── Progress calculation ─────────────────────────────────────
describe('toPercent', () => {
  it('returns 0% when total is 0', () => {
    expect(toPercent(0, 0)).toBe('0%')
  })

  it('calculates percentage correctly', () => {
    expect(toPercent(3, 10)).toBe('30%')
    expect(toPercent(5, 5)).toBe('100%')
    expect(toPercent(1, 3)).toBe('33%')
  })

  it('rounds to nearest integer', () => {
    expect(toPercent(1, 6)).toBe('17%')
  })
})

// ─── Utils ────────────────────────────────────────────────────
import { slugify, truncate, getInitials, enumToLabel } from '@/lib/utils'

describe('slugify', () => {
  it('converts title to slug', () => {
    expect(slugify('JavaScript Fundamentals')).toBe('javascript-fundamentals')
    expect(slugify('HTML & CSS Basics!')).toBe('html-css-basics')
  })

  it('handles multiple spaces and special chars', () => {
    expect(slugify('  Hello   World  ')).toBe('hello-world')
  })
})

describe('truncate', () => {
  it('returns full string when within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello…')
  })
})

describe('getInitials', () => {
  it('returns two initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Ada Okafor Nwosu')).toBe('AO')
  })

  it('returns single initial for single word', () => {
    expect(getInitials('Emeka')).toBe('E')
  })
})

describe('enumToLabel', () => {
  it('converts enum string to readable label', () => {
    expect(enumToLabel('AI_REVIEWED')).toBe('Ai Reviewed')
    expect(enumToLabel('INSTRUCTOR_REVIEWED')).toBe('Instructor Reviewed')
    expect(enumToLabel('GRADED')).toBe('Graded')
  })
})
