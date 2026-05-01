// Shared TypeScript types for the Wädi Alphütte app

export type EinnahmeKategorie = 'speisen' | 'getraenke' | 'uebernachtung' | 'kegelbahn'
export type AusgabeKategorie = 'lebensmittel' | 'dekoration' | 'anschaffung' | 'sonstiges'
export type Traeger = 'privat' | 'verein'

export interface Saison {
  id: number
  name: string
  jahr: number
  start_datum?: string
  end_datum?: string
  is_active: 0 | 1
  uebernachtung_preis: number
  kegelbahn_split_privat: number
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
  zimmer_belegung_id?: number
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

// ── New module types ──────────────────────────────────────────────────────────

export interface Helfer {
  id: number
  name: string
  telefon?: string
  email?: string
  notiz?: string
  erstellt_am: string
}

export interface HelferEinsatz {
  id: number
  saison_id: number
  helfer_id: number
  helfer_name?: string
  datum: string
  aufgabe: string
  schicht?: string
  uebernachtung: 0 | 1
  uebernachtung_von?: string
  uebernachtung_bis?: string
  zimmer_id?: number
  zimmer_name?: string
  zimmer_belegung_id?: number
  notiz?: string
  erstellt_am: string
}

export type ZimmerTyp = '6er' | '5er' | '4er' | 'huettenwart'

export interface Zimmer {
  id: number
  name: string
  typ: ZimmerTyp
  kapazitaet: number
}

export interface ZimmerBelegung {
  id: number
  saison_id: number
  zimmer_id: number
  zimmer_name?: string
  zimmer_typ?: ZimmerTyp
  kapazitaet?: number
  datum_von: string
  datum_bis: string
  gast_name: string
  typ: 'gast' | 'helfer'
  betten: number
  einnahme_id?: number
  notiz?: string
  erstellt_am: string
}

export type AnlassStatus = 'geplant' | 'bestaetigt' | 'abgesagt'
export type AnlassTyp = 'verein' | 'privat' | 'sonstiges'

export interface Anlass {
  id: number
  saison_id: number
  datum: string
  gruppe: string
  personenzahl_min: number
  personenzahl_max?: number
  typ: AnlassTyp
  kegelbahn: 0 | 1
  preis_pro_stunde?: number
  stunden: number
  notiz?: string
  status: AnlassStatus
  einnahme_id?: number
  erstellt_am: string
}

export interface Menue {
  id: number
  saison_id: number
  pfad: string
  hochgeladen_am: string
}

export type EinkaufKategorie = 'lebensmittel' | 'getraenke' | 'material' | 'sonstiges'

export interface Einkaufsitem {
  id: number
  saison_id: number
  kategorie: EinkaufKategorie
  artikel: string
  menge?: number
  einheit?: string
  besorgt: 0 | 1
  notiz?: string
  erstellt_am: string
}

export interface Rezept {
  id: number
  titel: string
  basis_personen: number
  zeitaufwand_min?: number
  zubereitung?: string
  notiz?: string
  erstellt_am: string
}

export interface RezeptZutat {
  id: number
  rezept_id: number
  artikel: string
  menge: number
  einheit?: string
}

export type TodoPrioritaet = 'hoch' | 'mittel' | 'tief'
export type TodoStatus = 'offen' | 'in_arbeit' | 'erledigt'

export interface Todo {
  id: number
  saison_id?: number
  titel: string
  beschreibung?: string
  prioritaet: TodoPrioritaet
  status: TodoStatus
  faellig_am?: string
  erstellt_am: string
}

export type LearningKategorie = 'positiv' | 'negativ' | 'verbesserung'

export interface Learning {
  id: number
  saison_id?: number
  datum: string
  kategorie: LearningKategorie
  titel: string
  beschreibung?: string
  erstellt_am: string
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
  openPdfDialog: () => Promise<string | null>
  openPath: (path: string) => Promise<void>
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
  // Helfer & Einsätze
  getAllHelfer: () => Promise<Helfer[]>
  saveHelfer: (data: Partial<Helfer>) => Promise<Helfer>
  deleteHelfer: (id: number) => Promise<void>
  getEinsaetze: (saisonId: number) => Promise<HelferEinsatz[]>
  saveEinsatz: (data: Partial<HelferEinsatz>) => Promise<HelferEinsatz>
  deleteEinsatz: (id: number) => Promise<void>
  // Zimmer
  getAllZimmer: () => Promise<Zimmer[]>
  getZimmerBelegung: (saisonId: number) => Promise<ZimmerBelegung[]>
  saveZimmerBelegung: (data: Partial<ZimmerBelegung>) => Promise<ZimmerBelegung>
  deleteZimmerBelegung: (id: number, deleteEinnahmeEntry?: boolean) => Promise<void>
  // Anlässe
  getAnlaesse: (saisonId: number) => Promise<Anlass[]>
  saveAnlass: (data: Partial<Anlass>) => Promise<Anlass>
  deleteAnlass: (id: number) => Promise<void>
  // Menü
  getMenue: (saisonId: number) => Promise<Menue | undefined>
  saveMenue: (saisonId: number, pfad: string) => Promise<Menue>
  deleteMenue: (saisonId: number) => Promise<void>
  // Einkaufsliste
  getEinkaufsliste: (saisonId: number) => Promise<Einkaufsitem[]>
  saveEinkaufsitem: (data: Partial<Einkaufsitem>) => Promise<Einkaufsitem>
  toggleEinkaufsitemBesorgt: (id: number) => Promise<Einkaufsitem>
  deleteEinkaufsitem: (id: number) => Promise<void>
  deleteCheckedEinkauf: (saisonId: number) => Promise<void>
  // Rezepte
  getAllRezepte: () => Promise<Rezept[]>
  saveRezept: (data: Partial<Rezept>) => Promise<Rezept>
  saveRezeptZutaten: (rezeptId: number, zutaten: RezeptZutat[]) => Promise<void>
  getRezeptZutaten: (rezeptId: number) => Promise<RezeptZutat[]>
  deleteRezept: (id: number) => Promise<void>
  // Todos
  getTodos: (saisonId?: number) => Promise<Todo[]>
  saveTodo: (data: Partial<Todo>) => Promise<Todo>
  deleteTodo: (id: number) => Promise<void>
  // Learnings
  getLearnings: (saisonId?: number) => Promise<Learning[]>
  saveLearning: (data: Partial<Learning>) => Promise<Learning>
  deleteLearning: (id: number) => Promise<void>
  // Settings
  getAppSettings: () => Promise<Record<string, string>>
  setAppSetting: (key: string, value: string) => Promise<void>
  // Einkaufsliste Sync
  syncEinkaufToAusgaben: (saisonId: number, data: { foodAmount?: number, drinksAmount?: number }) => Promise<number>
}
