import { describe, it, expect } from 'vitest'

// ── Menue path resolution ─────────────────────────────────────────────────────

const DEFAULT_MENUE_FILENAME = 'Menue.pdf'

function resolveMenuePath(pfad: string | undefined): string {
  if (!pfad) return DEFAULT_MENUE_FILENAME
  return pfad
}

describe('resolveMenuePath', () => {
  it('falls back to default when no path is set', () => {
    expect(resolveMenuePath(undefined)).toBe('Menue.pdf')
  })
  it('returns custom path when provided', () => {
    expect(resolveMenuePath('/custom/path/MyMenu.pdf')).toBe('/custom/path/MyMenu.pdf')
  })
  it('returns default filename when empty string', () => {
    expect(resolveMenuePath('')).toBe('Menue.pdf')
  })
})

// ── Menue filename display ────────────────────────────────────────────────────

function extractFilename(pfad: string): string {
  return pfad.split(/[/\\]/).pop() ?? pfad
}

describe('extractFilename', () => {
  it('extracts filename from Unix path', () => {
    expect(extractFilename('/home/user/documents/Menue_Sommer.pdf')).toBe('Menue_Sommer.pdf')
  })
  it('extracts filename from Windows path', () => {
    expect(extractFilename('C:\\Users\\Cristian\\Documents\\Menue.pdf')).toBe('Menue.pdf')
  })
  it('returns the string itself when no separator', () => {
    expect(extractFilename('Menue.pdf')).toBe('Menue.pdf')
  })
})
