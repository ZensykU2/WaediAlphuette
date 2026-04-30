import { describe, it, expect } from 'vitest'

// ── Anlass status logic ───────────────────────────────────────────────────────

type AnlassStatus = 'geplant' | 'bestaetigt' | 'abgesagt'

const STATUS_LABELS: Record<AnlassStatus, string> = {
  geplant: 'Geplant', bestaetigt: 'Bestätigt', abgesagt: 'Abgesagt'
}

describe('Anlass status labels', () => {
  it('maps geplant correctly', () => {
    expect(STATUS_LABELS['geplant']).toBe('Geplant')
  })
  it('maps bestaetigt correctly', () => {
    expect(STATUS_LABELS['bestaetigt']).toBe('Bestätigt')
  })
  it('maps abgesagt correctly', () => {
    expect(STATUS_LABELS['abgesagt']).toBe('Abgesagt')
  })
})

// ── Personenzahl display ──────────────────────────────────────────────────────

function formatPersonenzahl(min: number, max?: number): string {
  if (max && max !== min) return `${min}–${max}`
  return `${min}`
}

describe('formatPersonenzahl', () => {
  it('shows single number when min equals max', () => {
    expect(formatPersonenzahl(30, 30)).toBe('30')
  })
  it('shows range when min and max differ', () => {
    expect(formatPersonenzahl(30, 40)).toBe('30–40')
  })
  it('shows just min when max is undefined', () => {
    expect(formatPersonenzahl(5)).toBe('5')
  })
})

// ── Kegelbahn price formatting ────────────────────────────────────────────────

describe('Kegelbahn price', () => {
  it('formats CHF price correctly', () => {
    const preis = 25.5
    const formatted = `CHF ${preis.toFixed(2)} / Std.`
    expect(formatted).toBe('CHF 25.50 / Std.')
  })
})
