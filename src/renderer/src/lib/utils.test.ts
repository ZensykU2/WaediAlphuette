import { describe, it, expect } from 'vitest'
import { calcGetraenkeAnteile, formatCHF, formatDate } from './utils'

describe('calcGetraenkeAnteile', () => {
  it('calculates 18% privat and 82% verein', () => {
    const result = calcGetraenkeAnteile(100)
    expect(result.privat).toBe(18)
    expect(result.verein).toBe(82)
  })

  it('rounds to 2 decimal places', () => {
    const result = calcGetraenkeAnteile(50)
    expect(result.privat).toBe(9)
    expect(result.verein).toBe(41)
    expect(result.privat + result.verein).toBe(50)
  })

  it('handles CHF 123.45', () => {
    const result = calcGetraenkeAnteile(123.45)
    expect(result.privat + result.verein).toBeCloseTo(123.45, 1)
    expect(result.privat).toBeCloseTo(22.22, 1)
  })

  it('returns zero for zero input', () => {
    const result = calcGetraenkeAnteile(0)
    expect(result.privat).toBe(0)
    expect(result.verein).toBe(0)
  })
})

describe('formatCHF', () => {
  it('formats positive numbers as CHF', () => {
    expect(formatCHF(1234.5)).toMatch(/1.?234[.,]50/)
  })

  it('handles zero', () => {
    expect(formatCHF(0)).toMatch(/0[.,]00/)
  })
})

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const formatted = formatDate('2024-07-15')
    expect(formatted).toContain('15')
    expect(formatted).toContain('07')
    expect(formatted).toContain('2024')
  })

  it('returns dash for empty input', () => {
    expect(formatDate('')).toBe('—')
  })
})
