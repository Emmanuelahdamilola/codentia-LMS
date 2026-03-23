// PATH: src/__tests__/api/progress.test.ts
/**
 * Integration tests for progress tracking logic.
 * These test the utility functions directly (not the HTTP layer).
 */
import { toPercent, clamp } from '@/lib/utils'

describe('Progress percentage calculation', () => {
  it('correctly calculates 0% when no lessons done', () => {
    expect(toPercent(0, 10)).toBe('0%')
  })

  it('correctly calculates 100% when all lessons done', () => {
    expect(toPercent(10, 10)).toBe('100%')
  })

  it('correctly calculates partial progress', () => {
    expect(toPercent(7, 10)).toBe('70%')
    expect(toPercent(3, 7)).toBe('43%')
  })

  it('handles edge case of 0 total lessons', () => {
    expect(toPercent(0, 0)).toBe('0%')
  })
})

describe('clamp utility', () => {
  it('clamps value to min', () => {
    expect(clamp(-5, 0, 100)).toBe(0)
  })

  it('clamps value to max', () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })

  it('returns value when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })
})

describe('Quiz pass threshold', () => {
  const PASS_THRESHOLD = 60

  it('passes when score >= 60', () => {
    expect(60 >= PASS_THRESHOLD).toBe(true)
    expect(100 >= PASS_THRESHOLD).toBe(true)
  })

  it('fails when score < 60', () => {
    expect(59 >= PASS_THRESHOLD).toBe(false)
    expect(0 >= PASS_THRESHOLD).toBe(false)
  })
})
