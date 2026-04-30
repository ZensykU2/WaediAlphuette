import initSqlJs from 'sql.js'
import type { Database } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { is } from '@electron-toolkit/utils'

let db: Database
let dbFilePath: string

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  // Locate the WASM binary: in dev use node_modules, in prod use extraResources
  const wasmPath = is.dev
    ? join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
    : join(process.resourcesPath, 'sql-wasm.wasm')

  const SQL = await initSqlJs({ locateFile: () => wasmPath })

  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')
  mkdirSync(dbDir, { recursive: true })
  dbFilePath = join(dbDir, 'waedi.db')

  if (existsSync(dbFilePath)) {
    db = new SQL.Database(readFileSync(dbFilePath))
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  runMigrations()
  persist()
}

function persist(): void {
  const data = db.export()
  writeFileSync(dbFilePath, Buffer.from(data))
}

// ── Query helpers ─────────────────────────────────────────────────────────────

function all<T = Record<string, any>>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) rows.push(stmt.getAsObject() as T)
  stmt.free()
  return rows
}

function get<T = Record<string, any>>(sql: string, params: any[] = []): T | undefined {
  return all<T>(sql, params)[0]
}

function run(sql: string, params: any[] = []): void {
  db.run(sql, params)
  persist()
}

function lastId(): number {
  const res = db.exec('SELECT last_insert_rowid()')
  return (res[0]?.values?.[0]?.[0] ?? 0) as number
}

// ── Schema migrations ─────────────────────────────────────────────────────────

function runMigrations(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS saisons (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      jahr        INTEGER NOT NULL,
      start_datum TEXT,
      end_datum   TEXT,
      is_active   INTEGER NOT NULL DEFAULT 0,
      erstellt_am TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_plan (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id       INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      kategorie       TEXT    NOT NULL,
      betrag_geplant  REAL    NOT NULL DEFAULT 0,
      notiz           TEXT
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS einnahmen (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id     INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      datum         TEXT    NOT NULL,
      kategorie     TEXT    NOT NULL CHECK(kategorie IN ('speisen','getraenke','uebernachtung')),
      brutto        REAL    NOT NULL DEFAULT 0,
      anteil_privat REAL    NOT NULL DEFAULT 0,
      anteil_verein REAL    NOT NULL DEFAULT 0,
      notiz         TEXT,
      erstellt_am   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS ausgaben (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id   INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      datum       TEXT    NOT NULL,
      kategorie   TEXT    NOT NULL CHECK(kategorie IN ('lebensmittel','dekoration','anschaffung','sonstiges')),
      betrag      REAL    NOT NULL DEFAULT 0,
      traeger     TEXT    NOT NULL CHECK(traeger IN ('privat','verein')) DEFAULT 'verein',
      notiz       TEXT,
      erstellt_am TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS import_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id     INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      datei_name    TEXT    NOT NULL,
      importiert_am TEXT    NOT NULL DEFAULT (datetime('now')),
      zeilen_count  INTEGER NOT NULL DEFAULT 0,
      status        TEXT    NOT NULL DEFAULT 'ok'
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS getraenke_stammdaten (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      groesse       TEXT,
      verkaufspreis REAL NOT NULL DEFAULT 0,
      ek_preis      REAL NOT NULL DEFAULT 0,
      gast_preis    REAL NOT NULL DEFAULT 0,
      min_bestand   INTEGER DEFAULT 0
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS getraenke_abrechnung (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id       INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      getraenk_id     INTEGER NOT NULL REFERENCES getraenke_stammdaten(id) ON DELETE CASCADE,
      bestand_antritt INTEGER NOT NULL DEFAULT 0,
      lieferungen     INTEGER NOT NULL DEFAULT 0,
      bestand_abgabe  INTEGER NOT NULL DEFAULT 0,
      eigenkonsum     INTEGER NOT NULL DEFAULT 0,
      arbeitstag_1    INTEGER NOT NULL DEFAULT 0,
      arbeitstag_2    INTEGER NOT NULL DEFAULT 0,
      arbeitstag_3    INTEGER NOT NULL DEFAULT 0,
      helfer_konsum   INTEGER NOT NULL DEFAULT 0,
      verbrauch_gast  INTEGER NOT NULL DEFAULT 0,
      UNIQUE(saison_id, getraenk_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS getraenke_wochen_snapshots (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id       INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      getraenk_id     INTEGER NOT NULL REFERENCES getraenke_stammdaten(id) ON DELETE CASCADE,
      woche_montag    TEXT    NOT NULL,
      typ             TEXT    NOT NULL CHECK(typ IN ('start','ende')),
      bestand_antritt INTEGER NOT NULL DEFAULT 0,
      lieferungen     INTEGER NOT NULL DEFAULT 0,
      verbrauch_gast  INTEGER NOT NULL DEFAULT 0,
      eigenkonsum     INTEGER NOT NULL DEFAULT 0,
      helfer_konsum   INTEGER NOT NULL DEFAULT 0,
      erstellt_am     TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(saison_id, getraenk_id, woche_montag, typ)
    )
  `)

  // ── New feature tables ────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS helfer (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      telefon   TEXT,
      email     TEXT,
      notiz     TEXT,
      erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS helfer_einsaetze (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id      INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      helfer_id      INTEGER NOT NULL REFERENCES helfer(id) ON DELETE CASCADE,
      datum          TEXT    NOT NULL,
      aufgabe        TEXT    NOT NULL,
      schicht        TEXT,
      uebernachtung  INTEGER NOT NULL DEFAULT 0,
      zimmer_id      INTEGER REFERENCES zimmer(id) ON DELETE SET NULL,
      notiz          TEXT,
      erstellt_am    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS zimmer (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      typ        TEXT NOT NULL CHECK(typ IN ('6er','5er','4er','huettenwart')),
      kapazitaet INTEGER NOT NULL DEFAULT 1
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS zimmer_belegung (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id  INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      zimmer_id  INTEGER NOT NULL REFERENCES zimmer(id) ON DELETE CASCADE,
      datum_von  TEXT NOT NULL,
      datum_bis  TEXT NOT NULL,
      gast_name  TEXT NOT NULL,
      typ        TEXT NOT NULL CHECK(typ IN ('gast','helfer')),
      notiz      TEXT,
      erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS anlaesse (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id         INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      datum             TEXT    NOT NULL,
      gruppe            TEXT    NOT NULL,
      personenzahl_min  INTEGER NOT NULL DEFAULT 1,
      personenzahl_max  INTEGER,
      typ               TEXT    NOT NULL CHECK(typ IN ('verein','privat','sonstiges')) DEFAULT 'verein',
      kegelbahn         INTEGER NOT NULL DEFAULT 0,
      preis_pro_stunde  REAL,
      notiz             TEXT,
      status            TEXT    NOT NULL CHECK(status IN ('geplant','bestaetigt','abgesagt')) DEFAULT 'geplant',
      erstellt_am       TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS menue (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id    INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      pfad         TEXT    NOT NULL,
      hochgeladen_am TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(saison_id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS einkaufsliste (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id  INTEGER NOT NULL REFERENCES saisons(id) ON DELETE CASCADE,
      kategorie  TEXT NOT NULL CHECK(kategorie IN ('lebensmittel','getraenke','material','sonstiges')) DEFAULT 'lebensmittel',
      artikel    TEXT NOT NULL,
      menge      REAL,
      einheit    TEXT,
      besorgt    INTEGER NOT NULL DEFAULT 0,
      notiz      TEXT,
      erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS rezepte (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      titel           TEXT    NOT NULL,
      basis_personen  INTEGER NOT NULL DEFAULT 4,
      zeitaufwand_min INTEGER,
      zubereitung     TEXT,
      notiz           TEXT,
      erstellt_am     TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS rezept_zutaten (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      rezept_id  INTEGER NOT NULL REFERENCES rezepte(id) ON DELETE CASCADE,
      artikel    TEXT    NOT NULL,
      menge      REAL    NOT NULL DEFAULT 0,
      einheit    TEXT
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id    INTEGER REFERENCES saisons(id) ON DELETE CASCADE,
      titel        TEXT NOT NULL,
      beschreibung TEXT,
      prioritaet   TEXT NOT NULL CHECK(prioritaet IN ('hoch','mittel','tief')) DEFAULT 'mittel',
      status       TEXT NOT NULL CHECK(status IN ('offen','in_arbeit','erledigt')) DEFAULT 'offen',
      faellig_am   TEXT,
      erstellt_am  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS learnings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      saison_id    INTEGER REFERENCES saisons(id) ON DELETE CASCADE,
      datum        TEXT NOT NULL DEFAULT (date('now')),
      kategorie    TEXT NOT NULL CHECK(kategorie IN ('positiv','negativ','verbesserung')) DEFAULT 'positiv',
      titel        TEXT NOT NULL,
      beschreibung TEXT,
      erstellt_am  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Seed standard Zimmer (idempotent)
  const zimmerCount = (get<any>('SELECT COUNT(*) as c FROM zimmer') ?? { c: 0 }).c
  if (Number(zimmerCount) === 0) {
    db.run(`INSERT INTO zimmer (name, typ, kapazitaet) VALUES
      ('Zimmer 6er', '6er', 6),
      ('Zimmer 5er', '5er', 5),
      ('Zimmer 4er', '4er', 4),
      ('Hüttenwartszimmer', 'huettenwart', 2)`)
    persist()
  }

  // One-time migrations for existing DBs
  try {
     db.run('ALTER TABLE getraenke_stammdaten ADD COLUMN min_bestand INTEGER DEFAULT 0')
  } catch (e) {
     // Column already exists, ignore
  }

  try { db.run('ALTER TABLE getraenke_abrechnung ADD COLUMN helfer_konsum INTEGER NOT NULL DEFAULT 0') } catch (e) {}
  try { db.run('ALTER TABLE getraenke_abrechnung ADD COLUMN verbrauch_gast INTEGER NOT NULL DEFAULT 0') } catch (e) {}
  try { 
    db.run('UPDATE getraenke_abrechnung SET helfer_konsum = arbeitstag_1 + arbeitstag_2 + arbeitstag_3 WHERE helfer_konsum = 0 AND (arbeitstag_1 > 0 OR arbeitstag_2 > 0 OR arbeitstag_3 > 0)')
    db.run('UPDATE getraenke_abrechnung SET verbrauch_gast = MAX(0, bestand_antritt + lieferungen - bestand_abgabe - eigenkonsum - helfer_konsum) WHERE verbrauch_gast = 0 AND (bestand_antritt > 0 OR lieferungen > 0)')
  } catch(e) {}
}

// ── Saisons ───────────────────────────────────────────────────────────────────

export function getAllSaisons() {
  return all('SELECT * FROM saisons ORDER BY jahr DESC, id DESC')
}

export function getSaisonById(id: number) {
  return get('SELECT * FROM saisons WHERE id = ?', [id])
}

export function createSaison(data: {
  name: string; jahr: number; start_datum?: string; end_datum?: string
}) {
  run(
    'INSERT INTO saisons (name, jahr, start_datum, end_datum, is_active) VALUES (?,?,?,?,0)',
    [data.name, data.jahr, data.start_datum ?? null, data.end_datum ?? null]
  )
  return get('SELECT * FROM saisons WHERE id = ?', [lastId()])
}

export function updateSaison(id: number, data: Partial<{ name: string; start_datum: string; end_datum: string }>) {
  const keys = Object.keys(data) as Array<keyof typeof data>
  if (!keys.length) return
  const set = keys.map(k => `${k} = ?`).join(', ')
  const vals = keys.map(k => data[k] ?? null)
  run(`UPDATE saisons SET ${set} WHERE id = ?`, [...vals, id])
}

export function deleteSaison(id: number) {
  run('DELETE FROM saisons WHERE id = ?', [id])
}

export function setActiveSaison(id: number) {
  db.run('BEGIN')
  try {
    db.run('UPDATE saisons SET is_active = 0')
    db.run('UPDATE saisons SET is_active = 1 WHERE id = ?', [id])
    db.run('COMMIT')
    persist()
  } catch (e) {
    db.run('ROLLBACK')
    throw e
  }
}

export function getActiveSaison() {
  return get('SELECT * FROM saisons WHERE is_active = 1 LIMIT 1')
}

// ── Einnahmen ─────────────────────────────────────────────────────────────────

export function getEinnahmen(filter: {
  saison_id?: number; datum_von?: string; datum_bis?: string; kategorie?: string
}) {
  let sql = 'SELECT * FROM einnahmen WHERE 1=1'
  const params: any[] = []
  if (filter.saison_id) { sql += ' AND saison_id = ?'; params.push(filter.saison_id) }
  if (filter.datum_von) { sql += ' AND datum >= ?';    params.push(filter.datum_von) }
  if (filter.datum_bis) { sql += ' AND datum <= ?';    params.push(filter.datum_bis) }
  if (filter.kategorie) { sql += ' AND kategorie = ?'; params.push(filter.kategorie) }
  sql += ' ORDER BY datum DESC, id DESC'
  return all(sql, params)
}

export function addEinnahme(entry: {
  saison_id: number; datum: string
  kategorie: 'speisen' | 'getraenke' | 'uebernachtung'
  brutto: number; notiz?: string
}) {
  const { anteil_privat, anteil_verein } = calcAnteile(entry.kategorie, entry.brutto)
  run(
    'INSERT INTO einnahmen (saison_id,datum,kategorie,brutto,anteil_privat,anteil_verein,notiz) VALUES (?,?,?,?,?,?,?)',
    [entry.saison_id, entry.datum, entry.kategorie, entry.brutto, anteil_privat, anteil_verein, entry.notiz ?? null]
  )
  return get('SELECT * FROM einnahmen WHERE id = ?', [lastId()])
}

export function updateEinnahme(id: number, data: Record<string, any>) {
  const existing = get<any>('SELECT * FROM einnahmen WHERE id = ?', [id])
  if (!existing) return
  const kat = (data.kategorie ?? existing.kategorie) as 'speisen' | 'getraenke' | 'uebernachtung'
  const brutto = data.brutto ?? existing.brutto
  const { anteil_privat, anteil_verein } = calcAnteile(kat, brutto)
  const merged = { ...data, anteil_privat, anteil_verein }
  const keys = Object.keys(merged)
  const set = keys.map(k => `${k} = ?`).join(', ')
  run(`UPDATE einnahmen SET ${set} WHERE id = ?`, [...keys.map(k => (merged as any)[k] ?? null), id])
}

export function deleteEinnahme(id: number) {
  run('DELETE FROM einnahmen WHERE id = ?', [id])
}

// ── Ausgaben ──────────────────────────────────────────────────────────────────

export function getAusgaben(filter: {
  saison_id?: number; datum_von?: string; datum_bis?: string; kategorie?: string; traeger?: string
}) {
  let sql = 'SELECT * FROM ausgaben WHERE 1=1'
  const params: any[] = []
  if (filter.saison_id) { sql += ' AND saison_id = ?'; params.push(filter.saison_id) }
  if (filter.datum_von) { sql += ' AND datum >= ?';    params.push(filter.datum_von) }
  if (filter.datum_bis) { sql += ' AND datum <= ?';    params.push(filter.datum_bis) }
  if (filter.kategorie) { sql += ' AND kategorie = ?'; params.push(filter.kategorie) }
  if (filter.traeger)   { sql += ' AND traeger = ?';   params.push(filter.traeger)   }
  sql += ' ORDER BY datum DESC, id DESC'
  return all(sql, params)
}

export function addAusgabe(entry: {
  saison_id: number; datum: string
  kategorie: 'lebensmittel' | 'dekoration' | 'anschaffung' | 'sonstiges'
  betrag: number; traeger: 'privat' | 'verein'; notiz?: string
}) {
  run(
    'INSERT INTO ausgaben (saison_id,datum,kategorie,betrag,traeger,notiz) VALUES (?,?,?,?,?,?)',
    [entry.saison_id, entry.datum, entry.kategorie, entry.betrag, entry.traeger, entry.notiz ?? null]
  )
  return get('SELECT * FROM ausgaben WHERE id = ?', [lastId()])
}

export function updateAusgabe(id: number, data: Record<string, any>) {
  const keys = Object.keys(data)
  if (!keys.length) return
  const set = keys.map(k => `${k} = ?`).join(', ')
  run(`UPDATE ausgaben SET ${set} WHERE id = ?`, [...keys.map(k => (data as any)[k] ?? null), id])
}

export function deleteAusgabe(id: number) {
  run('DELETE FROM ausgaben WHERE id = ?', [id])
}

// ── Budget ────────────────────────────────────────────────────────────────────

export function getBudgetPlan(saisonId: number) {
  return all('SELECT * FROM budget_plan WHERE saison_id = ?', [saisonId])
}

export function saveBudgetPlan(items: Array<{
  saison_id: number; kategorie: string; betrag_geplant: number; notiz?: string
}>) {
  if (!items.length) return
  db.run('BEGIN')
  try {
    db.run('DELETE FROM budget_plan WHERE saison_id = ?', [items[0].saison_id])
    for (const item of items) {
      db.run(
        'INSERT INTO budget_plan (saison_id,kategorie,betrag_geplant,notiz) VALUES (?,?,?,?)',
        [item.saison_id, item.kategorie, item.betrag_geplant, item.notiz ?? null]
      )
    }
    db.run('COMMIT')
    persist()
  } catch (e) {
    db.run('ROLLBACK')
    throw e
  }
}

// ── Reporting ─────────────────────────────────────────────────────────────────

export function getDashboardStats(saisonId: number) {
  const ein = get<any>(
    `SELECT COALESCE(SUM(brutto),0) AS total_einnahmen,
            COALESCE(SUM(anteil_privat),0) AS einnahmen_privat,
            COALESCE(SUM(anteil_verein),0) AS einnahmen_verein
     FROM einnahmen WHERE saison_id = ?`,
    [saisonId]
  ) ?? { total_einnahmen: 0, einnahmen_privat: 0, einnahmen_verein: 0 }

  const aus = get<any>(
    `SELECT COALESCE(SUM(betrag),0) AS total_ausgaben,
            COALESCE(SUM(CASE WHEN traeger='privat' THEN betrag ELSE 0 END),0) AS ausgaben_privat,
            COALESCE(SUM(CASE WHEN traeger='verein' THEN betrag ELSE 0 END),0) AS ausgaben_verein
     FROM ausgaben WHERE saison_id = ?`,
    [saisonId]
  ) ?? { total_ausgaben: 0, ausgaben_privat: 0, ausgaben_verein: 0 }

  const tagesumsatz = all<any>(
    `SELECT datum, COALESCE(SUM(brutto),0) AS umsatz
     FROM einnahmen WHERE saison_id = ?
     GROUP BY datum ORDER BY datum DESC LIMIT 7`,
    [saisonId]
  ).reverse()

  return {
    einnahmen: ein,
    ausgaben: aus,
    gewinn_verein: ein.einnahmen_verein - aus.ausgaben_verein,
    gewinn_privat: ein.einnahmen_privat - aus.ausgaben_privat,
    tagesumsatz
  }
}

export function getTagesauswertung(datum: string, saisonId: number) {
  return {
    einnahmen: all('SELECT * FROM einnahmen WHERE datum = ? AND saison_id = ?', [datum, saisonId]),
    ausgaben:  all('SELECT * FROM ausgaben  WHERE datum = ? AND saison_id = ?', [datum, saisonId])
  }
}

export function getWochenauswertung(weekStart: string, saisonId: number) {
  const weekEnd = new Date(weekStart + 'T00:00:00')
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  return {
    weekStart,
    weekEnd: weekEndStr,
    einnahmen: all(
      `SELECT datum, kategorie,
              SUM(brutto) AS total_brutto,
              SUM(anteil_privat) AS total_privat,
              SUM(anteil_verein) AS total_verein
       FROM einnahmen WHERE saison_id = ? AND datum BETWEEN ? AND ?
       GROUP BY datum, kategorie ORDER BY datum`,
      [saisonId, weekStart, weekEndStr]
    ),
    ausgaben: all(
      `SELECT datum, kategorie, traeger, SUM(betrag) AS total
       FROM ausgaben WHERE saison_id = ? AND datum BETWEEN ? AND ?
       GROUP BY datum, kategorie, traeger ORDER BY datum`,
      [saisonId, weekStart, weekEndStr]
    )
  }
}

export function getGesamtauswertung(saisonId: number) {
  return {
    einByKat: all(
      `SELECT kategorie, SUM(brutto) AS brutto,
              SUM(anteil_privat) AS privat, SUM(anteil_verein) AS verein
       FROM einnahmen WHERE saison_id = ? GROUP BY kategorie`,
      [saisonId]
    ),
    ausByKat: all(
      `SELECT kategorie, traeger, SUM(betrag) AS total
       FROM ausgaben WHERE saison_id = ? GROUP BY kategorie, traeger`,
      [saisonId]
    ),
    budget: getBudgetPlan(saisonId)
  }
}

// ── Import log ────────────────────────────────────────────────────────────────

export function logImport(saisonId: number, dateiName: string, zeilenCount: number) {
  run(
    'INSERT INTO import_log (saison_id,datei_name,zeilen_count) VALUES (?,?,?)',
    [saisonId, dateiName, zeilenCount]
  )
}

// ── Business calculations ─────────────────────────────────────────────────────

export function calcAnteile(
  kategorie: 'speisen' | 'getraenke' | 'uebernachtung',
  brutto: number
): { anteil_privat: number; anteil_verein: number } {
  if (kategorie === 'speisen') {
    return { anteil_privat: brutto, anteil_verein: 0 }
  } else if (kategorie === 'getraenke') {
    return {
      anteil_privat: Math.round(brutto * 0.18 * 100) / 100,
      anteil_verein: Math.round(brutto * 0.82 * 100) / 100
    }
  } else {
    // uebernachtung
    return { anteil_privat: 0, anteil_verein: brutto }
  }
}

// ── Getränke ──────────────────────────────────────────────────────────────────

export function getGetraenkeStammdaten() {
  return all('SELECT * FROM getraenke_stammdaten ORDER BY name ASC')
}

export function saveGetraenkStammdat(drink: {
  id?: number
  name: string
  groesse?: string
  verkaufspreis: number
  ek_preis: number
  gast_preis: number
  min_bestand?: number
}) {
  if (drink.id) {
    run(
      'UPDATE getraenke_stammdaten SET name=?, groesse=?, verkaufspreis=?, ek_preis=?, gast_preis=?, min_bestand=? WHERE id=?',
      [drink.name, drink.groesse || null, drink.verkaufspreis, drink.ek_preis, drink.gast_preis, drink.min_bestand || 0, drink.id]
    )
  } else {
    run(
      'INSERT INTO getraenke_stammdaten (name, groesse, verkaufspreis, ek_preis, gast_preis, min_bestand) VALUES (?,?,?,?,?,?)',
      [drink.name, drink.groesse || null, drink.verkaufspreis, drink.ek_preis, drink.gast_preis, drink.min_bestand || 0]
    )
  }
}

export function deleteGetraenkStammdat(id: number) {
  run('DELETE FROM getraenke_stammdaten WHERE id = ?', [id])
}

export function getGetraenkeAbrechnung(saisonId: number) {
  // We join stammdaten to get the current names, sizes and prices
  // and left join the existing settlement data for this season.
  return all(
    `SELECT 
      s.id as getraenk_id,
      s.name,
      s.groesse,
      s.verkaufspreis,
      s.ek_preis,
      s.gast_preis,
      s.min_bestand,
      COALESCE(a.id, 0) as id,
      COALESCE(a.bestand_antritt, 0) as bestand_antritt,
      COALESCE(a.lieferungen, 0) as lieferungen,
      COALESCE(a.bestand_abgabe, 0) as bestand_abgabe,
      COALESCE(a.eigenkonsum, 0) as eigenkonsum,
      COALESCE(a.arbeitstag_1, 0) as arbeitstag_1,
      COALESCE(a.arbeitstag_2, 0) as arbeitstag_2,
      COALESCE(a.arbeitstag_3, 0) as arbeitstag_3,
      COALESCE(a.helfer_konsum, 0) as helfer_konsum,
      COALESCE(a.verbrauch_gast, 0) as verbrauch_gast
    FROM getraenke_stammdaten s
    LEFT JOIN getraenke_abrechnung a ON s.id = a.getraenk_id AND a.saison_id = ?
    ORDER BY s.name ASC`,
    [saisonId]
  )
}

export function saveGetraenkeAbrechnung(saisonId: number, settlements: any[]) {
  db.run('BEGIN')
  try {
    for (const row of settlements) {
      db.run(
        `INSERT INTO getraenke_abrechnung (
          saison_id, getraenk_id, bestand_antritt, lieferungen, bestand_abgabe, 
          eigenkonsum, arbeitstag_1, arbeitstag_2, arbeitstag_3, helfer_konsum, verbrauch_gast
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(saison_id, getraenk_id) DO UPDATE SET
          bestand_antritt = excluded.bestand_antritt,
          lieferungen = excluded.lieferungen,
          bestand_abgabe = excluded.bestand_abgabe,
          eigenkonsum = excluded.eigenkonsum,
          arbeitstag_1 = excluded.arbeitstag_1,
          arbeitstag_2 = excluded.arbeitstag_2,
          arbeitstag_3 = excluded.arbeitstag_3,
          helfer_konsum = excluded.helfer_konsum,
          verbrauch_gast = excluded.verbrauch_gast`,
        [
          saisonId,
          row.getraenk_id,
          row.bestand_antritt || 0,
          row.lieferungen || 0,
          row.bestand_abgabe || 0,
          row.eigenkonsum || 0,
          row.arbeitstag_1 || 0,
          row.arbeitstag_2 || 0,
          row.arbeitstag_3 || 0,
          row.helfer_konsum || 0,
          row.verbrauch_gast || 0
        ]
      )
    }
    db.run('COMMIT')
    persist()
  } catch (e) {
    db.run('ROLLBACK')
    throw e
  }
}

export function bookGetraenkeRevenue(saisonId: number, amount: number) {
  const notizPrefix = `[Abrechnung] Getränke`
  const existing = get(
    "SELECT id FROM einnahmen WHERE saison_id = ? AND notiz LIKE ? LIMIT 1",
    [saisonId, notizPrefix + '%']
  ) as any

  const today = new Date().toISOString().split('T')[0]
  const { anteil_privat, anteil_verein } = calcAnteile('getraenke', amount)

  if (existing) {
    run(
      "UPDATE einnahmen SET brutto = ?, anteil_privat = ?, anteil_verein = ?, datum = ? WHERE id = ?",
      [amount, anteil_privat, anteil_verein, today, existing.id]
    )
    return { status: 'updated', id: existing.id }
  } else {
    run(
      `INSERT INTO einnahmen (saison_id, datum, kategorie, brutto, anteil_privat, anteil_verein, notiz) 
       VALUES (?, ?, 'getraenke', ?, ?, ?, ?)`,
      [saisonId, today, amount, anteil_privat, anteil_verein, notizPrefix]
    )
    return { status: 'created' }
  }
}

export function getGetraenkeBookingStatus(saisonId: number) {
  const notizPrefix = `[Abrechnung] Getränke`
  return get(
    "SELECT datum, brutto FROM einnahmen WHERE saison_id = ? AND notiz LIKE ? LIMIT 1",
    [saisonId, notizPrefix + '%']
  )
}

export function unbookGetraenkeRevenue(saisonId: number) {
  const notizPrefix = `[Abrechnung] Getränke`
  run(
    "DELETE FROM einnahmen WHERE saison_id = ? AND notiz LIKE ?",
    [saisonId, notizPrefix + '%']
  )
}

// ── Wochen-Snapshots ──────────────────────────────────────────────────────────

/**
 * Creates a snapshot of the current getraenke_abrechnung for the given week and type.
 * Uses INSERT OR IGNORE so it is safe to call multiple times on the same day.
 * Returns true if at least one row was newly inserted.
 */
export function createWeekSnapshot(
  saisonId: number,
  wocheMontag: string,
  typ: 'start' | 'ende'
): boolean {
  const rows = all<any>(
    `SELECT getraenk_id, bestand_antritt, lieferungen, verbrauch_gast, eigenkonsum, helfer_konsum
     FROM getraenke_abrechnung WHERE saison_id = ?`,
    [saisonId]
  )
  if (!rows.length) return false

  let created = false
  db.run('BEGIN')
  try {
    for (const row of rows) {
      db.run(
        `INSERT OR IGNORE INTO getraenke_wochen_snapshots
          (saison_id, getraenk_id, woche_montag, typ,
           bestand_antritt, lieferungen, verbrauch_gast, eigenkonsum, helfer_konsum)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [saisonId, row.getraenk_id, wocheMontag, typ,
         row.bestand_antritt, row.lieferungen, row.verbrauch_gast, row.eigenkonsum, row.helfer_konsum]
      )
      const changes = db.exec('SELECT changes()')[0]?.values?.[0]?.[0]
      if (Number(changes) > 0) created = true
    }
    db.run('COMMIT')
    persist()
  } catch (e) {
    db.run('ROLLBACK')
    return false
  }
  return created
}

/** Returns a list of all weeks that have at least one snapshot for this season. */
export function getWeekSnapshotList(saisonId: number) {
  return all(
    `SELECT woche_montag,
            MAX(CASE WHEN typ='start' THEN 1 ELSE 0 END) AS has_start,
            MAX(CASE WHEN typ='ende'  THEN 1 ELSE 0 END) AS has_ende
     FROM getraenke_wochen_snapshots
     WHERE saison_id = ?
     GROUP BY woche_montag
     ORDER BY woche_montag DESC`,
    [saisonId]
  )
}

/** Returns all drink rows for a specific week snapshot (start or ende). */
export function getWeekSnapshot(saisonId: number, wocheMontag: string, typ: 'start' | 'ende') {
  return all(
    `SELECT s.getraenk_id, g.name, g.groesse, g.verkaufspreis, g.ek_preis, g.gast_preis,
            s.bestand_antritt, s.lieferungen, s.verbrauch_gast, s.eigenkonsum, s.helfer_konsum
     FROM getraenke_wochen_snapshots s
     JOIN getraenke_stammdaten g ON s.getraenk_id = g.id
     WHERE s.saison_id = ? AND s.woche_montag = ? AND s.typ = ?
     ORDER BY g.name ASC`,
    [saisonId, wocheMontag, typ]
  )
}

// ── Helfer ────────────────────────────────────────────────────────────────────

export function getAllHelfer() {
  return all('SELECT * FROM helfer ORDER BY name ASC')
}

export function saveHelfer(h: { id?: number; name: string; telefon?: string; email?: string; notiz?: string }) {
  if (h.id) {
    run('UPDATE helfer SET name=?, telefon=?, email=?, notiz=? WHERE id=?',
      [h.name, h.telefon ?? null, h.email ?? null, h.notiz ?? null, h.id])
    return get('SELECT * FROM helfer WHERE id=?', [h.id])
  }
  run('INSERT INTO helfer (name, telefon, email, notiz) VALUES (?,?,?,?)',
    [h.name, h.telefon ?? null, h.email ?? null, h.notiz ?? null])
  return get('SELECT * FROM helfer WHERE id=?', [lastId()])
}

export function deleteHelfer(id: number) {
  run('DELETE FROM helfer WHERE id=?', [id])
}

// ── Helfer-Einsätze ───────────────────────────────────────────────────────────

export function getEinsaetze(saisonId: number) {
  return all(
    `SELECT e.*, h.name AS helfer_name, z.name AS zimmer_name
     FROM helfer_einsaetze e
     JOIN helfer h ON e.helfer_id = h.id
     LEFT JOIN zimmer z ON e.zimmer_id = z.id
     WHERE e.saison_id = ?
     ORDER BY e.datum ASC, h.name ASC`,
    [saisonId]
  )
}

export function saveEinsatz(e: {
  id?: number; saison_id: number; helfer_id: number; datum: string;
  aufgabe: string; schicht?: string; uebernachtung?: boolean; zimmer_id?: number; notiz?: string
}) {
  const ue = e.uebernachtung ? 1 : 0
  if (e.id) {
    run('UPDATE helfer_einsaetze SET saison_id=?,helfer_id=?,datum=?,aufgabe=?,schicht=?,uebernachtung=?,zimmer_id=?,notiz=? WHERE id=?',
      [e.saison_id, e.helfer_id, e.datum, e.aufgabe, e.schicht ?? null, ue, e.zimmer_id ?? null, e.notiz ?? null, e.id])
    return get('SELECT * FROM helfer_einsaetze WHERE id=?', [e.id])
  }
  run('INSERT INTO helfer_einsaetze (saison_id,helfer_id,datum,aufgabe,schicht,uebernachtung,zimmer_id,notiz) VALUES (?,?,?,?,?,?,?,?)',
    [e.saison_id, e.helfer_id, e.datum, e.aufgabe, e.schicht ?? null, ue, e.zimmer_id ?? null, e.notiz ?? null])
  return get('SELECT * FROM helfer_einsaetze WHERE id=?', [lastId()])
}

export function deleteEinsatz(id: number) {
  run('DELETE FROM helfer_einsaetze WHERE id=?', [id])
}

// ── Zimmer ────────────────────────────────────────────────────────────────────

export function getAllZimmer() {
  return all('SELECT * FROM zimmer ORDER BY typ, name')
}

export function getZimmerBelegung(saisonId: number) {
  return all(
    `SELECT b.*, z.name AS zimmer_name, z.typ AS zimmer_typ, z.kapazitaet
     FROM zimmer_belegung b
     JOIN zimmer z ON b.zimmer_id = z.id
     WHERE b.saison_id = ?
     ORDER BY b.datum_von ASC`,
    [saisonId]
  )
}

export function saveZimmerBelegung(b: {
  id?: number; saison_id: number; zimmer_id: number;
  datum_von: string; datum_bis: string; gast_name: string; typ: 'gast' | 'helfer'; notiz?: string
}) {
  if (b.id) {
    run('UPDATE zimmer_belegung SET saison_id=?,zimmer_id=?,datum_von=?,datum_bis=?,gast_name=?,typ=?,notiz=? WHERE id=?',
      [b.saison_id, b.zimmer_id, b.datum_von, b.datum_bis, b.gast_name, b.typ, b.notiz ?? null, b.id])
    return get('SELECT * FROM zimmer_belegung WHERE id=?', [b.id])
  }
  run('INSERT INTO zimmer_belegung (saison_id,zimmer_id,datum_von,datum_bis,gast_name,typ,notiz) VALUES (?,?,?,?,?,?,?)',
    [b.saison_id, b.zimmer_id, b.datum_von, b.datum_bis, b.gast_name, b.typ, b.notiz ?? null])
  return get('SELECT * FROM zimmer_belegung WHERE id=?', [lastId()])
}

export function deleteZimmerBelegung(id: number) {
  run('DELETE FROM zimmer_belegung WHERE id=?', [id])
}

// ── Anlässe ───────────────────────────────────────────────────────────────────

export function getAnlaesse(saisonId: number) {
  return all('SELECT * FROM anlaesse WHERE saison_id=? ORDER BY datum ASC', [saisonId])
}

export function saveAnlass(a: {
  id?: number; saison_id: number; datum: string; gruppe: string;
  personenzahl_min: number; personenzahl_max?: number; typ: string;
  kegelbahn?: boolean; preis_pro_stunde?: number; notiz?: string;
  status?: string
}) {
  const kb = a.kegelbahn ? 1 : 0
  const status = a.status ?? 'geplant'
  if (a.id) {
    run('UPDATE anlaesse SET saison_id=?,datum=?,gruppe=?,personenzahl_min=?,personenzahl_max=?,typ=?,kegelbahn=?,preis_pro_stunde=?,notiz=?,status=? WHERE id=?',
      [a.saison_id, a.datum, a.gruppe, a.personenzahl_min, a.personenzahl_max ?? null, a.typ, kb, a.preis_pro_stunde ?? null, a.notiz ?? null, status, a.id])
    return get('SELECT * FROM anlaesse WHERE id=?', [a.id])
  }
  run('INSERT INTO anlaesse (saison_id,datum,gruppe,personenzahl_min,personenzahl_max,typ,kegelbahn,preis_pro_stunde,notiz,status) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [a.saison_id, a.datum, a.gruppe, a.personenzahl_min, a.personenzahl_max ?? null, a.typ, kb, a.preis_pro_stunde ?? null, a.notiz ?? null, status])
  return get('SELECT * FROM anlaesse WHERE id=?', [lastId()])
}

export function deleteAnlass(id: number) {
  run('DELETE FROM anlaesse WHERE id=?', [id])
}

// ── Menü ──────────────────────────────────────────────────────────────────────

export function getMenue(saisonId: number) {
  return get('SELECT * FROM menue WHERE saison_id=?', [saisonId])
}

export function saveMenue(saisonId: number, pfad: string) {
  run('INSERT INTO menue (saison_id, pfad) VALUES (?,?) ON CONFLICT(saison_id) DO UPDATE SET pfad=excluded.pfad, hochgeladen_am=datetime(\'now\')',
    [saisonId, pfad])
  return get('SELECT * FROM menue WHERE saison_id=?', [saisonId])
}

// ── Einkaufsliste ─────────────────────────────────────────────────────────────

export function getEinkaufsliste(saisonId: number) {
  return all('SELECT * FROM einkaufsliste WHERE saison_id=? ORDER BY kategorie ASC, artikel ASC', [saisonId])
}

export function saveEinkaufsitem(item: {
  id?: number; saison_id: number; kategorie: string; artikel: string;
  menge?: number; einheit?: string; besorgt?: boolean; notiz?: string
}) {
  const besorgt = item.besorgt ? 1 : 0
  if (item.id) {
    run('UPDATE einkaufsliste SET saison_id=?,kategorie=?,artikel=?,menge=?,einheit=?,besorgt=?,notiz=? WHERE id=?',
      [item.saison_id, item.kategorie, item.artikel, item.menge ?? null, item.einheit ?? null, besorgt, item.notiz ?? null, item.id])
    return get('SELECT * FROM einkaufsliste WHERE id=?', [item.id])
  }
  run('INSERT INTO einkaufsliste (saison_id,kategorie,artikel,menge,einheit,besorgt,notiz) VALUES (?,?,?,?,?,?,?)',
    [item.saison_id, item.kategorie, item.artikel, item.menge ?? null, item.einheit ?? null, besorgt, item.notiz ?? null])
  return get('SELECT * FROM einkaufsliste WHERE id=?', [lastId()])
}

export function toggleEinkaufsitemBesorgt(id: number) {
  run('UPDATE einkaufsliste SET besorgt = 1 - besorgt WHERE id=?', [id])
  return get('SELECT * FROM einkaufsliste WHERE id=?', [id])
}

export function deleteEinkaufsitem(id: number) {
  run('DELETE FROM einkaufsliste WHERE id=?', [id])
}

// ── Rezepte ───────────────────────────────────────────────────────────────────

export function getAllRezepte() {
  return all('SELECT * FROM rezepte ORDER BY titel ASC')
}

export function saveRezept(r: {
  id?: number; titel: string; basis_personen: number;
  zeitaufwand_min?: number; zubereitung?: string; notiz?: string
}) {
  if (r.id) {
    run('UPDATE rezepte SET titel=?,basis_personen=?,zeitaufwand_min=?,zubereitung=?,notiz=? WHERE id=?',
      [r.titel, r.basis_personen, r.zeitaufwand_min ?? null, r.zubereitung ?? null, r.notiz ?? null, r.id])
    return get('SELECT * FROM rezepte WHERE id=?', [r.id])
  }
  run('INSERT INTO rezepte (titel,basis_personen,zeitaufwand_min,zubereitung,notiz) VALUES (?,?,?,?,?)',
    [r.titel, r.basis_personen, r.zeitaufwand_min ?? null, r.zubereitung ?? null, r.notiz ?? null])
  return get('SELECT * FROM rezepte WHERE id=?', [lastId()])
}

export function saveRezeptZutaten(rezeptId: number, zutaten: Array<{ artikel: string; menge: number; einheit?: string }>) {
  db.run('BEGIN')
  try {
    db.run('DELETE FROM rezept_zutaten WHERE rezept_id=?', [rezeptId])
    for (const z of zutaten) {
      db.run('INSERT INTO rezept_zutaten (rezept_id,artikel,menge,einheit) VALUES (?,?,?,?)',
        [rezeptId, z.artikel, z.menge, z.einheit ?? null])
    }
    db.run('COMMIT')
    persist()
  } catch (e) {
    db.run('ROLLBACK')
    throw e
  }
}

export function getRezeptZutaten(rezeptId: number) {
  return all('SELECT * FROM rezept_zutaten WHERE rezept_id=? ORDER BY id ASC', [rezeptId])
}

export function deleteRezept(id: number) {
  run('DELETE FROM rezepte WHERE id=?', [id])
}

// ── Todos ─────────────────────────────────────────────────────────────────────

export function getTodos(saisonId?: number) {
  if (saisonId) {
    return all('SELECT * FROM todos WHERE saison_id=? ORDER BY prioritaet ASC, erstellt_am DESC', [saisonId])
  }
  return all('SELECT * FROM todos ORDER BY prioritaet ASC, erstellt_am DESC')
}

export function saveTodo(t: {
  id?: number; saison_id?: number; titel: string; beschreibung?: string;
  prioritaet?: string; status?: string; faellig_am?: string
}) {
  const prio = t.prioritaet ?? 'mittel'
  const status = t.status ?? 'offen'
  if (t.id) {
    run('UPDATE todos SET saison_id=?,titel=?,beschreibung=?,prioritaet=?,status=?,faellig_am=? WHERE id=?',
      [t.saison_id ?? null, t.titel, t.beschreibung ?? null, prio, status, t.faellig_am ?? null, t.id])
    return get('SELECT * FROM todos WHERE id=?', [t.id])
  }
  run('INSERT INTO todos (saison_id,titel,beschreibung,prioritaet,status,faellig_am) VALUES (?,?,?,?,?,?)',
    [t.saison_id ?? null, t.titel, t.beschreibung ?? null, prio, status, t.faellig_am ?? null])
  return get('SELECT * FROM todos WHERE id=?', [lastId()])
}

export function deleteTodo(id: number) {
  run('DELETE FROM todos WHERE id=?', [id])
}

// ── Learnings ─────────────────────────────────────────────────────────────────

export function getLearnings(saisonId?: number) {
  if (saisonId) {
    return all('SELECT * FROM learnings WHERE saison_id=? ORDER BY datum DESC', [saisonId])
  }
  return all('SELECT * FROM learnings ORDER BY datum DESC')
}

export function saveLearning(l: {
  id?: number; saison_id?: number; datum?: string;
  kategorie: string; titel: string; beschreibung?: string
}) {
  const datum = l.datum ?? new Date().toISOString().split('T')[0]
  if (l.id) {
    run('UPDATE learnings SET saison_id=?,datum=?,kategorie=?,titel=?,beschreibung=? WHERE id=?',
      [l.saison_id ?? null, datum, l.kategorie, l.titel, l.beschreibung ?? null, l.id])
    return get('SELECT * FROM learnings WHERE id=?', [l.id])
  }
  run('INSERT INTO learnings (saison_id,datum,kategorie,titel,beschreibung) VALUES (?,?,?,?,?)',
    [l.saison_id ?? null, datum, l.kategorie, l.titel, l.beschreibung ?? null])
  return get('SELECT * FROM learnings WHERE id=?', [lastId()])
}

export function deleteLearning(id: number) {
  run('DELETE FROM learnings WHERE id=?', [id])
}
