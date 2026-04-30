import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock window.api for all renderer tests
const mockApi = {
  // ── Saisons ──────────────────────────────────────────────
  getSaisons: vi.fn().mockResolvedValue([]),
  createSaison: vi.fn().mockResolvedValue({}),
  updateSaison: vi.fn().mockResolvedValue({}),
  deleteSaison: vi.fn().mockResolvedValue({}),
  setActiveSaison: vi.fn().mockResolvedValue({}),
  // ── Einnahmen ─────────────────────────────────────────────
  getEinnahmen: vi.fn().mockResolvedValue([]),
  addEinnahme: vi.fn().mockResolvedValue({}),
  updateEinnahme: vi.fn().mockResolvedValue({}),
  deleteEinnahme: vi.fn().mockResolvedValue({}),
  // ── Ausgaben ──────────────────────────────────────────────
  getAusgaben: vi.fn().mockResolvedValue([]),
  addAusgabe: vi.fn().mockResolvedValue({}),
  updateAusgabe: vi.fn().mockResolvedValue({}),
  deleteAusgabe: vi.fn().mockResolvedValue({}),
  // ── Budget ────────────────────────────────────────────────
  getBudgetPlan: vi.fn().mockResolvedValue([]),
  saveBudgetPlan: vi.fn().mockResolvedValue({}),
  // ── Reporting ─────────────────────────────────────────────
  getDashboardStats: vi.fn().mockResolvedValue({
    einnahmen: { total_einnahmen: 0, einnahmen_privat: 0, einnahmen_verein: 0 },
    ausgaben: { total_ausgaben: 0, ausgaben_privat: 0, ausgaben_verein: 0 },
    gewinn_verein: 0, gewinn_privat: 0, tagesumsatz: []
  }),
  getTagesauswertung: vi.fn().mockResolvedValue({ einnahmen: [], ausgaben: [] }),
  getWochenauswertung: vi.fn().mockResolvedValue({ einnahmen: [], ausgaben: [] }),
  getGesamtauswertung: vi.fn().mockResolvedValue({ einByKat: [], ausByKat: [], budget: [] }),
  // ── Excel / Dialogs ───────────────────────────────────────
  importExcel: vi.fn().mockResolvedValue({ success: true, rows: 0, errors: [] }),
  exportExcel: vi.fn().mockResolvedValue({}),
  openFileDialog: vi.fn().mockResolvedValue(null),
  saveFileDialog: vi.fn().mockResolvedValue(null),
  openPdfDialog: vi.fn().mockResolvedValue(null),
  // ── Getränke ──────────────────────────────────────────────
  getGetraenkeStammdaten: vi.fn().mockResolvedValue([]),
  saveGetraenkStammdat: vi.fn().mockResolvedValue({}),
  deleteGetraenkStammdat: vi.fn().mockResolvedValue({}),
  getGetraenkeAbrechnung: vi.fn().mockResolvedValue([]),
  saveGetraenkeAbrechnung: vi.fn().mockResolvedValue({}),
  exportGetraenkeExcel: vi.fn().mockResolvedValue({}),
  getGetraenkeBookingStatus: vi.fn().mockResolvedValue(null),
  bookGetraenkeRevenue: vi.fn().mockResolvedValue({}),
  unbookGetraenkeRevenue: vi.fn().mockResolvedValue({}),
  getWeekSnapshotList: vi.fn().mockResolvedValue([]),
  getWeekSnapshot: vi.fn().mockResolvedValue([]),
  exportWeekGetraenkeExcel: vi.fn().mockResolvedValue({}),
  // ── Helfer ────────────────────────────────────────────────
  getAllHelfer: vi.fn().mockResolvedValue([]),
  saveHelfer: vi.fn().mockResolvedValue({ id: 1, name: 'Test Helfer' }),
  deleteHelfer: vi.fn().mockResolvedValue({}),
  getEinsaetze: vi.fn().mockResolvedValue([]),
  saveEinsatz: vi.fn().mockResolvedValue({ id: 1 }),
  deleteEinsatz: vi.fn().mockResolvedValue({}),
  // ── Zimmer ────────────────────────────────────────────────
  getAllZimmer: vi.fn().mockResolvedValue([
    { id: 1, name: 'Zimmer 6er', typ: '6er', kapazitaet: 6 },
    { id: 2, name: 'Zimmer 5er', typ: '5er', kapazitaet: 5 },
    { id: 3, name: 'Zimmer 4er', typ: '4er', kapazitaet: 4 },
    { id: 4, name: 'Hüttenwartszimmer', typ: 'huettenwart', kapazitaet: 2 },
  ]),
  getZimmerBelegung: vi.fn().mockResolvedValue([]),
  saveZimmerBelegung: vi.fn().mockResolvedValue({ id: 1 }),
  deleteZimmerBelegung: vi.fn().mockResolvedValue({}),
  // ── Anlässe ───────────────────────────────────────────────
  getAnlaesse: vi.fn().mockResolvedValue([]),
  saveAnlass: vi.fn().mockResolvedValue({ id: 1 }),
  deleteAnlass: vi.fn().mockResolvedValue({}),
  // ── Menü ──────────────────────────────────────────────────
  getMenue: vi.fn().mockResolvedValue(null),
  saveMenue: vi.fn().mockResolvedValue({ id: 1, pfad: 'Menue.pdf' }),
  // ── Einkaufsliste ─────────────────────────────────────────
  getEinkaufsliste: vi.fn().mockResolvedValue([]),
  saveEinkaufsitem: vi.fn().mockResolvedValue({ id: 1 }),
  toggleEinkaufsitemBesorgt: vi.fn().mockResolvedValue({ id: 1, besorgt: 1 }),
  deleteEinkaufsitem: vi.fn().mockResolvedValue({}),
  // ── Rezepte ───────────────────────────────────────────────
  getAllRezepte: vi.fn().mockResolvedValue([]),
  saveRezept: vi.fn().mockResolvedValue({ id: 1 }),
  saveRezeptZutaten: vi.fn().mockResolvedValue({}),
  getRezeptZutaten: vi.fn().mockResolvedValue([]),
  deleteRezept: vi.fn().mockResolvedValue({}),
  // ── Todos ─────────────────────────────────────────────────
  getTodos: vi.fn().mockResolvedValue([]),
  saveTodo: vi.fn().mockResolvedValue({ id: 1 }),
  deleteTodo: vi.fn().mockResolvedValue({}),
  // ── Learnings ─────────────────────────────────────────────
  getLearnings: vi.fn().mockResolvedValue([]),
  saveLearning: vi.fn().mockResolvedValue({ id: 1 }),
  deleteLearning: vi.fn().mockResolvedValue({}),
}

Object.defineProperty(window, 'api', { value: mockApi, writable: true })
