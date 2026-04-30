import { describe, it, expect } from 'vitest'

// ── Zimmer conflict detection ─────────────────────────────────────────────────

interface Belegung { id: number; zimmer_id: number; datum_von: string; datum_bis: string }

function isOverlapping(a: Belegung, b: Belegung): boolean {
  if (a.id === b.id) return false
  if (a.zimmer_id !== b.zimmer_id) return false
  return a.datum_von <= b.datum_bis && a.datum_bis >= b.datum_von
}

function detectConflicts(belegungen: Belegung[]): Set<number> {
  const conflicts = new Set<number>()
  for (let i = 0; i < belegungen.length; i++) {
    for (let j = i + 1; j < belegungen.length; j++) {
      if (isOverlapping(belegungen[i], belegungen[j])) {
        conflicts.add(belegungen[i].id)
        conflicts.add(belegungen[j].id)
      }
    }
  }
  return conflicts
}

describe('isOverlapping', () => {
  const base: Belegung = { id: 1, zimmer_id: 1, datum_von: '2026-05-10', datum_bis: '2026-05-12' }

  it('detects overlap for same zimmer, overlapping dates', () => {
    const b: Belegung = { id: 2, zimmer_id: 1, datum_von: '2026-05-11', datum_bis: '2026-05-13' }
    expect(isOverlapping(base, b)).toBe(true)
  })

  it('no conflict for different zimmer', () => {
    const b: Belegung = { id: 2, zimmer_id: 2, datum_von: '2026-05-10', datum_bis: '2026-05-12' }
    expect(isOverlapping(base, b)).toBe(false)
  })

  it('no conflict when dates are adjacent (not overlapping)', () => {
    const b: Belegung = { id: 2, zimmer_id: 1, datum_von: '2026-05-13', datum_bis: '2026-05-15' }
    expect(isOverlapping(base, b)).toBe(false)
  })

  it('no conflict for same id', () => {
    expect(isOverlapping(base, base)).toBe(false)
  })

  it('detects full containment as conflict', () => {
    const b: Belegung = { id: 2, zimmer_id: 1, datum_von: '2026-05-09', datum_bis: '2026-05-14' }
    expect(isOverlapping(base, b)).toBe(true)
  })
})

describe('detectConflicts', () => {
  it('returns empty set when no conflicts', () => {
    const belegungen: Belegung[] = [
      { id: 1, zimmer_id: 1, datum_von: '2026-05-01', datum_bis: '2026-05-03' },
      { id: 2, zimmer_id: 1, datum_von: '2026-05-04', datum_bis: '2026-05-06' },
    ]
    expect(detectConflicts(belegungen).size).toBe(0)
  })

  it('identifies both overlapping belegungen', () => {
    const belegungen: Belegung[] = [
      { id: 1, zimmer_id: 1, datum_von: '2026-05-01', datum_bis: '2026-05-05' },
      { id: 2, zimmer_id: 1, datum_von: '2026-05-04', datum_bis: '2026-05-07' },
    ]
    const conflicts = detectConflicts(belegungen)
    expect(conflicts.has(1)).toBe(true)
    expect(conflicts.has(2)).toBe(true)
  })

  it('does not flag different zimmer as conflict', () => {
    const belegungen: Belegung[] = [
      { id: 1, zimmer_id: 1, datum_von: '2026-05-01', datum_bis: '2026-05-05' },
      { id: 2, zimmer_id: 2, datum_von: '2026-05-01', datum_bis: '2026-05-05' },
    ]
    expect(detectConflicts(belegungen).size).toBe(0)
  })
})
