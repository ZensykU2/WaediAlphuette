import { describe, it, expect } from 'vitest'
import { calculateDrinkRow, calculateSettlementTotals } from './getraenkeUtils'
import { GetraenkeAbrechnung } from '../types'

describe('getraenkeUtils', () => {
  const mockRow: GetraenkeAbrechnung = {
    id: 1,
    getraenk_id: 1,
    saison_id: 1,
    name: 'Mineral',
    groesse: '1l',
    verkaufspreis: 10.00,
    ek_preis: 2.00,
    gast_preis: 10.00,
    bestand_antritt: 100,
    lieferungen: 50,
    bestand_abgabe: 130, // Total verbrauch = 20
    eigenkonsum: 5,      // Paid at EK (2.00)
    arbeitstag_1: 2,
    arbeitstag_2: 3,
    arbeitstag_3: 0      // Helper total = 5 (Free)
  }

  // CALCULATION LOGIC:
  // verbrauch_total = 20
  // verbrauch_arbeitstag = 5
  // verbrauch_eigen = 5
  // verbrauch_gast = 20 - 5 - 5 = 10
  // umsatz_gast = 10 * 10 = 100
  // umsatz_eigen = 5 * 2 = 10
  // abrechnungsbetrag = 110
  // kosten_total = 20 * 2 = 40

  it('calculates consumption tracks correctly', () => {
    const result = calculateDrinkRow(mockRow)
    expect(result.verbrauch_total).toBe(20)
    expect(result.verbrauch_arbeitstag).toBe(5)
    expect(result.verbrauch_eigen).toBe(5)
    expect(result.verbrauch_gast).toBe(10)
  })

  it('calculates financial tracks correctly', () => {
    const result = calculateDrinkRow(mockRow)
    expect(result.umsatz_gast).toBe(100.00)
    expect(result.umsatz_eigen).toBe(10.00)
    expect(result.abrechnungsbetrag).toBe(110.00)
    expect(result.kosten_total).toBe(40.00)
  })

  it('calculates totals for multiple rows correctly', () => {
    const rows = [
      mockRow,
      {
        ...mockRow,
        getraenk_id: 2,
        verkaufspreis: 20.00,
        ek_preis: 5.00,
        bestand_antritt: 50,
        lieferungen: 0,
        bestand_abgabe: 40, // Total verbrauch = 10
        eigenkonsum: 2,
        arbeitstag_1: 0,
        arbeitstag_2: 0,
        arbeitstag_3: 0     // Helper total = 0
        // verbrauch_gast = 10 - 2 - 0 = 8
        // umsatz_gast = 8 * 20 = 160
        // umsatz_eigen = 2 * 5 = 10
        // abrechnungsbetrag = 170
      }
    ] as GetraenkeAbrechnung[]

    const totals = calculateSettlementTotals(rows)
    // Row 1: 110
    // Row 2: 170
    expect(totals.abrechnungsbetrag).toBe(110 + 170)
    expect(totals.umsatz_gast).toBe(100 + 160)
    expect(totals.umsatz_eigen).toBe(10 + 10)
    expect(totals.verbrauch_total).toBe(20 + 10)
  })
})
