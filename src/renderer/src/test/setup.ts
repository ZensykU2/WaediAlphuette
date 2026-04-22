import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock window.api for all renderer tests
const mockApi = {
  getSaisons: vi.fn().mockResolvedValue([]),
  createSaison: vi.fn().mockResolvedValue({}),
  updateSaison: vi.fn().mockResolvedValue({}),
  deleteSaison: vi.fn().mockResolvedValue({}),
  setActiveSaison: vi.fn().mockResolvedValue({}),
  getEinnahmen: vi.fn().mockResolvedValue([]),
  addEinnahme: vi.fn().mockResolvedValue({}),
  updateEinnahme: vi.fn().mockResolvedValue({}),
  deleteEinnahme: vi.fn().mockResolvedValue({}),
  getAusgaben: vi.fn().mockResolvedValue([]),
  addAusgabe: vi.fn().mockResolvedValue({}),
  updateAusgabe: vi.fn().mockResolvedValue({}),
  deleteAusgabe: vi.fn().mockResolvedValue({}),
  getBudgetPlan: vi.fn().mockResolvedValue([]),
  saveBudgetPlan: vi.fn().mockResolvedValue({}),
  getDashboardStats: vi.fn().mockResolvedValue({
    einnahmen: { total_einnahmen: 0, einnahmen_privat: 0, einnahmen_verein: 0 },
    ausgaben: { total_ausgaben: 0, ausgaben_privat: 0, ausgaben_verein: 0 },
    gewinn_verein: 0, gewinn_privat: 0, tagesumsatz: []
  }),
  getTagesauswertung: vi.fn().mockResolvedValue({ einnahmen: [], ausgaben: [] }),
  getWochenauswertung: vi.fn().mockResolvedValue({ einnahmen: [], ausgaben: [] }),
  getGesamtauswertung: vi.fn().mockResolvedValue({ einByKat: [], ausByKat: [], budget: [] }),
  importExcel: vi.fn().mockResolvedValue({ success: true, rows: 0, errors: [] }),
  exportExcel: vi.fn().mockResolvedValue({}),
  openFileDialog: vi.fn().mockResolvedValue(null),
  saveFileDialog: vi.fn().mockResolvedValue(null),
}

Object.defineProperty(window, 'api', { value: mockApi, writable: true })
