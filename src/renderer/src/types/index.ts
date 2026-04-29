// Shared TypeScript types for the Wädi Alphütte app

export type EinnahmeKategorie = 'speisen' | 'getraenke' | 'uebernachtung'
export type AusgabeKategorie = 'lebensmittel' | 'dekoration' | 'anschaffung' | 'sonstiges'
export type Traeger = 'privat' | 'verein'

export interface Saison {
  id: number
  name: string
  jahr: number
  start_datum?: string
  end_datum?: string
  is_active: 0 | 1
  erstellt_am: string
}

export interface Einnahme {
  id: number
  saison_id: number
  datum: string
  kategorie: EinnahmeKategorie
  brutto: number
  anteil_privat: number
  anteil_verein: number
  notiz?: string
  erstellt_am: string
}

export interface Ausgabe {
  id: number
  saison_id: number
  datum: string
  kategorie: AusgabeKategorie
  betrag: number
  traeger: Traeger
  notiz?: string
  erstellt_am: string
}

export interface BudgetPlanItem {
  id?: number
  saison_id: number
  kategorie: string
  betrag_geplant: number
  notiz?: string
}

export interface DashboardStats {
  einnahmen: {
    total_einnahmen: number
    einnahmen_privat: number
    einnahmen_verein: number
  }
  ausgaben: {
    total_ausgaben: number
    ausgaben_privat: number
    ausgaben_verein: number
  }
  gewinn_verein: number
  gewinn_privat: number
  tagesumsatz: Array<{ datum: string; umsatz: number }>
}

export interface EinnahmeFilter {
  saison_id?: number
  datum_von?: string
  datum_bis?: string
  kategorie?: EinnahmeKategorie
}

export interface AusgabeFilter {
  saison_id?: number
  datum_von?: string
  datum_bis?: string
  kategorie?: AusgabeKategorie
  traeger?: Traeger
}

export interface ImportResult {
  success: boolean
  rows: number
  errors: string[]
}

export interface Getraenk {
  id: number
  name: string
  groesse?: string
  verkaufspreis: number
  ek_preis: number
  gast_preis: number
  min_bestand?: number
}

export interface GetraenkeAbrechnung extends Getraenk {
  getraenk_id: number
  saison_id: number
  bestand_antritt: number
  lieferungen: number
  bestand_abgabe: number
  eigenkonsum: number
  arbeitstag_1: number // deprecated
  arbeitstag_2: number // deprecated
  arbeitstag_3: number // deprecated
  helfer_konsum: number
  verbrauch_gast: number
  min_bestand: number
}

export interface GetraenkeWochenSnapshot {
  getraenk_id: number
  name: string
  groesse?: string
  verkaufspreis: number
  ek_preis: number
  gast_preis: number
  bestand_antritt: number
  lieferungen: number
  verbrauch_gast: number
  eigenkonsum: number
  helfer_konsum: number
}

export interface WochenSnapshotMeta {
  woche_montag: string
  has_start: 0 | 1
  has_ende: 0 | 1
}

export interface WaediApi {
  getSaisons: () => Promise<Saison[]>
  createSaison: (data: Partial<Saison>) => Promise<Saison>
  updateSaison: (id: number, data: Partial<Saison>) => Promise<void>
  deleteSaison: (id: number) => Promise<void>
  setActiveSaison: (id: number) => Promise<void>
  getEinnahmen: (filter: EinnahmeFilter) => Promise<Einnahme[]>
  addEinnahme: (entry: Partial<Einnahme>) => Promise<Einnahme>
  updateEinnahme: (id: number, data: Partial<Einnahme>) => Promise<void>
  deleteEinnahme: (id: number) => Promise<void>
  getAusgaben: (filter: AusgabeFilter) => Promise<Ausgabe[]>
  addAusgabe: (entry: Partial<Ausgabe>) => Promise<Ausgabe>
  updateAusgabe: (id: number, data: Partial<Ausgabe>) => Promise<void>
  deleteAusgabe: (id: number) => Promise<void>
  getBudgetPlan: (saisonId: number) => Promise<BudgetPlanItem[]>
  saveBudgetPlan: (items: any[]) => Promise<void>
  getDashboardStats: (saisonId: number) => Promise<DashboardStats>
  getTagesauswertung: (datum: string, saisonId: number) => Promise<any>
  getWochenauswertung: (weekStart: string, saisonId: number) => Promise<any>
  getGesamtauswertung: (saisonId: number) => Promise<any>
  // Getränke
  getGetraenkeStammdaten: () => Promise<Getraenk[]>
  saveGetraenkStammdat: (drink: Partial<Getraenk>) => Promise<void>
  deleteGetraenkStammdat: (id: number) => Promise<void>
  getGetraenkeAbrechnung: (saisonId: number) => Promise<GetraenkeAbrechnung[]>
  saveGetraenkeAbrechnung: (saisonId: number, data: any[]) => Promise<void>
  exportGetraenkeExcel: (saisonId: number, filePath: string, date?: string) => Promise<void>
  getGetraenkeBookingStatus: (saisonId: number) => Promise<any>
  bookGetraenkeRevenue: (saisonId: number, amount: number) => Promise<void>
  unbookGetraenkeRevenue: (saisonId: number) => Promise<void>
  // Wochen-Snapshots
  getWeekSnapshotList: (saisonId: number) => Promise<WochenSnapshotMeta[]>
  getWeekSnapshot: (saisonId: number, wocheMontag: string, typ: 'start' | 'ende') => Promise<GetraenkeWochenSnapshot[]>
  exportWeekGetraenkeExcel: (saisonId: number, filePath: string, wocheMontag: string) => Promise<void>
  // Utils
  importExcel: (filePath: string) => Promise<ImportResult>
  exportExcel: (saisonId: number, filePath: string, date?: string) => Promise<void>
  openFileDialog: () => Promise<string | null>
  saveFileDialog: (defaultName: string) => Promise<string | null>
  // Window Controls
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (cb: (isMaximized: boolean) => void) => (() => void)
  onSnapshotCreated: (cb: (data: { typ: string; woche: string }) => void) => (() => void)
  // Auto-Updater
  onUpdateAvailable: (cb: () => void) => (() => void)
  onUpdateDownloaded: (cb: () => void) => (() => void)
  installUpdate: () => void
}
