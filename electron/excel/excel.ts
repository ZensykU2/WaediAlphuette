import ExcelJS from 'exceljs'
import {
  addEinnahme, addAusgabe, getEinnahmen, getAusgaben,
  getActiveSaison, getSaisonById, logImport
} from '../db/database'

// ── Import ───────────────────────────────────────────────────────────────────

export async function importExcel(filePath: string): Promise<{
  success: boolean
  rows: number
  errors: string[]
}> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const errors: string[] = []
  let rows = 0

  const saison = getActiveSaison() as any
  if (!saison) return { success: false, rows: 0, errors: ['Keine aktive Saison gefunden.'] }

  for (const sheet of workbook.worksheets) {
    const sheetName = sheet.name.toLowerCase()

    if (sheetName.includes('einnahm')) {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // header
        try {
          const datum = String(row.getCell(1).value || '').split('T')[0]
          const kategorie = String(row.getCell(2).value || '').toLowerCase() as any
          const brutto = Number(row.getCell(3).value) || 0
          const notiz = row.getCell(4).value ? String(row.getCell(4).value) : undefined

          if (!datum || !['speisen', 'getraenke', 'uebernachtung'].includes(kategorie)) {
            errors.push(`Zeile ${rowNumber}: Ungültige Daten (${datum}, ${kategorie})`)
            return
          }
          addEinnahme({ saison_id: saison.id, datum, kategorie, brutto, notiz })
          rows++
        } catch (e) {
          errors.push(`Zeile ${rowNumber}: ${String(e)}`)
        }
      })
    } else if (sheetName.includes('ausgab')) {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        try {
          const datum = String(row.getCell(1).value || '').split('T')[0]
          const kategorie = String(row.getCell(2).value || '').toLowerCase() as any
          const betrag = Number(row.getCell(3).value) || 0
          const traeger = (String(row.getCell(4).value || 'verein').toLowerCase()) as 'privat' | 'verein'
          const notiz = row.getCell(5).value ? String(row.getCell(5).value) : undefined

          if (!datum || !['lebensmittel', 'dekoration', 'anschaffung', 'sonstiges'].includes(kategorie)) {
            errors.push(`Zeile ${rowNumber}: Ungültige Daten`)
            return
          }
          addAusgabe({ saison_id: saison.id, datum, kategorie, betrag, traeger, notiz })
          rows++
        } catch (e) {
          errors.push(`Zeile ${rowNumber}: ${String(e)}`)
        }
      })
    }
  }

  const fileName = filePath.split(/[\\/]/).pop() || filePath
  logImport(saison.id, fileName, rows)
  return { success: errors.length === 0, rows, errors }
}

// ── Export ───────────────────────────────────────────────────────────────────

export async function exportExcel(saisonId: number, filePath: string, date?: string): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Wädi Alphütte'
  workbook.created = new Date()

  const saison = getSaisonById(saisonId) as any
  const title = date ? `Tagesbericht ${date}` : (saison ? `${saison.name} ${saison.jahr}` : 'Export')

  // ── Einnahmen Sheet ───────────────────────────────────────
  const einSheet = workbook.addWorksheet('Einnahmen')
  styleHeader(einSheet, ['Datum', 'Kategorie', 'Brutto (CHF)', 'Anteil Privat', 'Anteil Verein', 'Notiz'], [
    '#1a1c14', '#d4a24a'
  ])

  const einFilter = { saison_id: saisonId, ...(date ? { datum_von: date, datum_bis: date } : {}) }
  const einnahmen = getEinnahmen(einFilter)
  for (const e of einnahmen as any[]) {
    einSheet.addRow([e.datum, e.kategorie, e.brutto, e.anteil_privat, e.anteil_verein, e.notiz ?? ''])
  }
  autoFit(einSheet)

  // ── Ausgaben Sheet ────────────────────────────────────────
  const ausSheet = workbook.addWorksheet('Ausgaben')
  styleHeader(ausSheet, ['Datum', 'Kategorie', 'Betrag (CHF)', 'Träger', 'Notiz'], [
    '#1a1c14', '#d4a24a'
  ])
  const ausFilter = { saison_id: saisonId, ...(date ? { datum_von: date, datum_bis: date } : {}) }
  const ausgaben = getAusgaben(ausFilter)
  for (const a of ausgaben as any[]) {
    ausSheet.addRow([a.datum, a.kategorie, a.betrag, a.traeger, a.notiz ?? ''])
  }
  autoFit(ausSheet)

  // ── Zusammenfassung Sheet ─────────────────────────────────
  const sumSheet = workbook.addWorksheet('Zusammenfassung')
  sumSheet.columns = [{ width: 30 }, { width: 20 }, { width: 20 }]

  sumSheet.mergeCells('A1:C1')
  const titleCell = sumSheet.getCell('A1')
  titleCell.value = `🏔️ Wädi Alphütte — ${title}`
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFD4A24A' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1C14' } }

  const totalEin = (einnahmen as any[]).reduce((s, e) => s + e.brutto, 0)
  const totalPrivat = (einnahmen as any[]).reduce((s, e) => s + e.anteil_privat, 0)
  const totalVerein = (einnahmen as any[]).reduce((s, e) => s + e.anteil_verein, 0)
  const totalAus = (ausgaben as any[]).reduce((s, a) => s + a.betrag, 0)

  const rows = [
    ['', '', ''],
    ['Einnahmen gesamt', totalEin.toFixed(2), 'CHF'],
    ['  davon Privat', totalPrivat.toFixed(2), 'CHF'],
    ['  davon Verein', totalVerein.toFixed(2), 'CHF'],
    ['', '', ''],
    ['Ausgaben gesamt', totalAus.toFixed(2), 'CHF'],
    ['', '', ''],
    ['Gewinn Verein', (totalVerein - (ausgaben as any[]).filter(a => a.traeger === 'verein').reduce((s, a) => s + a.betrag, 0)).toFixed(2), 'CHF'],
    ['Gewinn Privat', (totalPrivat - (ausgaben as any[]).filter(a => a.traeger === 'privat').reduce((s, a) => s + a.betrag, 0)).toFixed(2), 'CHF'],
  ]

  for (const r of rows) sumSheet.addRow(r)

  await workbook.xlsx.writeFile(filePath)
}

export async function exportDrinksExcel(saisonId: number, filePath: string, date?: string): Promise<void> {
  const { getGetraenkeAbrechnung } = await import('../db/database')
  const { calculateDrinkRow } = await import('../../src/renderer/src/lib/getraenkeUtils')

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Getränkeabrechnung')
  const rows = getGetraenkeAbrechnung(saisonId) as any[]

  // Header 1: Main Title
  sheet.mergeCells('A1:L1')
  const title = sheet.getCell('A1')
  title.value = date ? `Getränkeabrechnung — Tagesbericht (${date})` : 'Getränkeabrechnung — Saisonbericht'
  title.font = { size: 18, bold: true, color: { argb: 'FFD4A24A' } }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1C14' } }
  title.alignment = { horizontal: 'center' }

  // Header 2: Sub-headers Grouping
  const headerRow2 = ['Produkt Info', '', 'Inventar (Bestand)', '', '', 'Verbrauch Tracks', '', '', '', 'Finanzielle Auswertung', '', '']
  sheet.addRow(headerRow2)
  sheet.mergeCells('A2:B2') // Produkt
  sheet.mergeCells('C2:E2') // Inventar
  sheet.mergeCells('F2:I2') // Verbrauch
  sheet.mergeCells('J2:L2') // Finanzen

  // Header 3: Detail Headers
  const headerRow3 = [
    'Name', 'Grösse', 
    'Anfangsbestand', 'Lieferungen', 'Verkauf (Gäste)', 
    'Eigenkonsum (EK)', 'Helfer (Staff)', 'Inventar Aktuell', 'Total Physikalisch',
    'Umsatz Gäste', 'Umsatz Eigen (EK)', 'Umsatz Total'
  ]
  sheet.addRow(headerRow3)

  // Style headers
  sheet.getRow(2).font = { bold: true, color: { argb: 'FFD4A24A' } }
  sheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2F26' } }
  
  sheet.getRow(3).font = { bold: true }
  sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }

  // Data
  rows.forEach(row => {
    const calcs = calculateDrinkRow(row)
    sheet.addRow([
      row.name,
      row.groesse,
      row.bestand_antritt,
      row.lieferungen,
      calcs.verbrauch_gast,
      calcs.verbrauch_eigen,
      calcs.verbrauch_arbeitstag,
      calcs.bestand_abgabe_calc,
      calcs.verbrauch_total,
      calcs.umsatz_gast,
      calcs.umsatz_eigen,
      calcs.abrechnungsbetrag
    ])
  })

  // Footers
  const lastRowNum = sheet.lastRow!.number
  const footerRow = sheet.addRow(['TOTAL', '', '', '', '', '', '', '', '',
    { formula: `SUM(J4:J${lastRowNum})` }, 
    { formula: `SUM(K4:K${lastRowNum})` }, 
    { formula: `SUM(L4:L${lastRowNum})` }
  ])
  footerRow.font = { bold: true }
  footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }

  autoFit(sheet)
  await workbook.xlsx.writeFile(filePath)
}

export async function exportDrinksWeekExcel(saisonId: number, filePath: string, wocheMontag: string): Promise<void> {
  const { getWeekSnapshot, getGetraenkeAbrechnung } = await import('../db/database')
  
  const startSnapshot = getWeekSnapshot(saisonId, wocheMontag, 'start') as any[]
  let endSnapshot = getWeekSnapshot(saisonId, wocheMontag, 'ende') as any[]
  
  // If no end snapshot exists yet (e.g. week not finished), use current values
  if (endSnapshot.length === 0) {
    endSnapshot = getGetraenkeAbrechnung(saisonId) as any[]
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(`KW ${wocheMontag}`)

  // Title
  sheet.mergeCells('A1:I1')
  const title = sheet.getCell('A1')
  title.value = `Wochenbericht Getränke — Woche ab ${wocheMontag}`
  title.font = { size: 16, bold: true, color: { argb: 'FFD4A24A' } }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1C14' } }
  title.alignment = { horizontal: 'center' }

  // Headers
  const headers = [
    'Produkt', 'Gebinde', 
    'Anfang (Mo)', 'Ende (So/Aktuell)', 'Delta (Woche)', 
    'Verkauf Gäste (Delta)', 'Eigen (Delta)', 'Helfer (Delta)', 'Umsatz Woche (CHF)'
  ]
  sheet.addRow(headers)
  const headerRow = sheet.getRow(2)
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }

  // Data
  startSnapshot.forEach(start => {
    const end = endSnapshot.find(e => e.getraenk_id === start.getraenk_id) || start
    
    // Deltas: usually we care about the change in recorded consumption/deliveries
    // or the change in inventory.
    // If we want "What happened this week", we look at the difference in recorded totals.
    const deltaGast = (end.verbrauch_gast || 0) - (start.verbrauch_gast || 0)
    const deltaEigen = (end.eigenkonsum || 0) - (start.eigenkonsum || 0)
    const deltaHelfer = (end.helfer_konsum || 0) - (start.helfer_konsum || 0)
    const deltaLief = (end.lieferungen || 0) - (start.lieferungen || 0)
    
    const verbrauchTotalWoche = deltaGast + deltaEigen + deltaHelfer
    const umsatzWoche = (deltaGast * start.verkaufspreis) + (deltaEigen * start.ek_preis)

    sheet.addRow([
      start.name,
      start.groesse,
      (start.bestand_antritt + start.lieferungen - (start.verbrauch_gast + start.eigenkonsum + start.helfer_konsum)), // Physical start of week
      (end.bestand_antritt + end.lieferungen - (end.verbrauch_gast + end.eigenkonsum + end.helfer_konsum)), // Physical end of week
      verbrauchTotalWoche,
      deltaGast,
      deltaEigen,
      deltaHelfer,
      umsatzWoche.toFixed(2)
    ])
  })

  // Total
  const lastRowNum = sheet.lastRow!.number
  const footerRow = sheet.addRow(['TOTAL', '', '', '', '', '', '', '', { formula: `SUM(I3:I${lastRowNum})` }])
  footerRow.font = { bold: true }
  footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }

  autoFit(sheet)
  await workbook.xlsx.writeFile(filePath)
}

function styleHeader(sheet: ExcelJS.Worksheet, headers: string[], colors: [string, string]) {
  sheet.addRow(headers)
  const headerRow = sheet.getRow(1)
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FF' + colors[1].replace('#', '') } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors[0].replace('#', '') } }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD4A24A' } } }
  })
}

function autoFit(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach(col => {
    let maxLen = 10
    col.eachCell?.({ includeEmpty: false }, cell => {
      const len = String(cell.value ?? '').length
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 4, 40)
  })
}
