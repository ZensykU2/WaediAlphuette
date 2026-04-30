import { describe, it, expect } from 'vitest'

// ── Rezept scaling logic ──────────────────────────────────────────────────────

function scaleZutat(menge: number, basisPersonen: number, targetPersonen: number): number {
  return Math.round((menge * (targetPersonen / basisPersonen)) * 100) / 100
}

describe('scaleZutat', () => {
  it('keeps menge unchanged when target equals basis', () => {
    expect(scaleZutat(500, 4, 4)).toBe(500)
  })
  it('doubles menge when target is double the basis', () => {
    expect(scaleZutat(250, 4, 8)).toBe(500)
  })
  it('halves menge when target is half the basis', () => {
    expect(scaleZutat(400, 4, 2)).toBe(200)
  })
  it('rounds to 2 decimal places', () => {
    expect(scaleZutat(100, 3, 5)).toBe(166.67)
  })
  it('handles 0 menge', () => {
    expect(scaleZutat(0, 4, 10)).toBe(0)
  })
})

// ── Einkaufsliste generation from rezept ─────────────────────────────────────

interface Zutat { artikel: string; menge: number; einheit?: string }

function generateEinkaufslisteFromRezept(
  zutaten: Zutat[],
  basisPersonen: number,
  targetPersonen: number
): Zutat[] {
  const faktor = targetPersonen / basisPersonen
  return zutaten.map(z => ({
    ...z,
    menge: Math.round(z.menge * faktor * 100) / 100
  }))
}

describe('generateEinkaufslisteFromRezept', () => {
  const zutaten: Zutat[] = [
    { artikel: 'Mehl', menge: 500, einheit: 'g' },
    { artikel: 'Eier', menge: 4, einheit: 'Stk' },
    { artikel: 'Butter', menge: 100, einheit: 'g' },
  ]

  it('scales correctly for 8 persons (basis 4)', () => {
    const result = generateEinkaufslisteFromRezept(zutaten, 4, 8)
    expect(result[0].menge).toBe(1000)
    expect(result[1].menge).toBe(8)
    expect(result[2].menge).toBe(200)
  })

  it('preserves artikel and einheit', () => {
    const result = generateEinkaufslisteFromRezept(zutaten, 4, 4)
    expect(result[0].artikel).toBe('Mehl')
    expect(result[0].einheit).toBe('g')
  })

  it('returns empty array for empty input', () => {
    expect(generateEinkaufslisteFromRezept([], 4, 8)).toEqual([])
  })
})
