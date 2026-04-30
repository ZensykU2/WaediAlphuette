import { describe, it, expect } from 'vitest'

// ── Todo status cycle ─────────────────────────────────────────────────────────

type TodoStatus = 'offen' | 'in_arbeit' | 'erledigt'

const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  offen: 'in_arbeit',
  in_arbeit: 'erledigt',
  erledigt: 'offen',
}

describe('Todo status cycle', () => {
  it('offen → in_arbeit', () => expect(STATUS_CYCLE['offen']).toBe('in_arbeit'))
  it('in_arbeit → erledigt', () => expect(STATUS_CYCLE['in_arbeit']).toBe('erledigt'))
  it('erledigt → offen', () => expect(STATUS_CYCLE['erledigt']).toBe('offen'))
})

// ── Overdue detection ─────────────────────────────────────────────────────────

function isOverdue(faellig_am: string | undefined, today: string, status: TodoStatus): boolean {
  if (!faellig_am) return false
  if (status === 'erledigt') return false
  return faellig_am < today
}

describe('isOverdue', () => {
  const today = '2026-05-01'

  it('returns true when past due and not erledigt', () => {
    expect(isOverdue('2026-04-30', today, 'offen')).toBe(true)
  })
  it('returns false when past due but erledigt', () => {
    expect(isOverdue('2026-04-30', today, 'erledigt')).toBe(false)
  })
  it('returns false when due in the future', () => {
    expect(isOverdue('2026-05-15', today, 'offen')).toBe(false)
  })
  it('returns false when no due date', () => {
    expect(isOverdue(undefined, today, 'offen')).toBe(false)
  })
  it('returns false when due is exactly today', () => {
    expect(isOverdue('2026-05-01', today, 'offen')).toBe(false)
  })
})

// ── Priority sort order ───────────────────────────────────────────────────────

type TodoPrioritaet = 'hoch' | 'mittel' | 'tief'

const PRIO_ORDER: Record<TodoPrioritaet, number> = { hoch: 0, mittel: 1, tief: 2 }

function sortByPriority(todos: Array<{ prioritaet: TodoPrioritaet; titel: string }>): typeof todos {
  return [...todos].sort((a, b) => PRIO_ORDER[a.prioritaet] - PRIO_ORDER[b.prioritaet])
}

describe('sortByPriority', () => {
  it('sorts hoch before mittel before tief', () => {
    const todos = [
      { prioritaet: 'tief' as const, titel: 'C' },
      { prioritaet: 'hoch' as const, titel: 'A' },
      { prioritaet: 'mittel' as const, titel: 'B' },
    ]
    const sorted = sortByPriority(todos)
    expect(sorted[0].prioritaet).toBe('hoch')
    expect(sorted[1].prioritaet).toBe('mittel')
    expect(sorted[2].prioritaet).toBe('tief')
  })
})
