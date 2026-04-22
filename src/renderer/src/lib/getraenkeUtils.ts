import { GetraenkeAbrechnung } from '../types'

export interface GetraenkeCalculations {
  verbrauch_total: number
  verbrauch_gast: number
  verbrauch_eigen: number
  verbrauch_arbeitstag: number
  umsatz_gast: number
  umsatz_eigen: number
  abrechnungsbetrag: number // Total Revenue: Guest + Eigen
  kosten_total: number
}

/**
 * Calculates all derived fields for a single drink settlement row.
 * Logic:
 * 1. Current Inventory (bestand_abgabe) = Antritt + Lieferung - Guest - Eigen - Helper
 * 2. Total consumption = Guest + Eigen + Helper
 * 3. Guest consumption is directly recorded
 * 4. Helper consumption is directly recorded
 * 5. Eigenkonsum = Personal consumption (Paid at EK Price)
 */
export function calculateDrinkRow(row: GetraenkeAbrechnung): GetraenkeCalculations & { bestand_abgabe_calc: number } {
  const verbrauch_gast = row.verbrauch_gast || 0
  const verbrauch_eigen = row.eigenkonsum || 0
  const verbrauch_arbeitstag = row.helfer_konsum || 0

  const verbrauch_total = verbrauch_gast + verbrauch_eigen + verbrauch_arbeitstag
  
  // Calculate what the inventory should be 
  const bestand_abgabe_calc = Math.max(0, (row.bestand_antritt || 0) + (row.lieferungen || 0) - verbrauch_total)
  
  const umsatz_gast = verbrauch_gast * (row.verkaufspreis || 0)
  const umsatz_eigen = verbrauch_eigen * (row.ek_preis || 0)
  const abrechnungsbetrag = umsatz_gast + umsatz_eigen
  
  const kosten_total = verbrauch_total * (row.ek_preis || 0)

  return {
    verbrauch_total,
    verbrauch_gast,
    verbrauch_eigen,
    verbrauch_arbeitstag,
    umsatz_gast,
    umsatz_eigen,
    abrechnungsbetrag,
    kosten_total,
    bestand_abgabe_calc
  }
}

/**
 * Calculates sums for the entire settlement table.
 */
export function calculateSettlementTotals(rows: GetraenkeAbrechnung[]) {
  return rows.reduce(
    (acc, row) => {
      const calcs = calculateDrinkRow(row)
      acc.abrechnungsbetrag += calcs.abrechnungsbetrag
      acc.umsatz_gast += calcs.umsatz_gast
      acc.umsatz_eigen += calcs.umsatz_eigen
      acc.kosten_total += calcs.kosten_total
      acc.verbrauch_total += calcs.verbrauch_total
      return acc
    },
    {
      abrechnungsbetrag: 0,
      umsatz_gast: 0,
      umsatz_eigen: 0,
      kosten_total: 0,
      verbrauch_total: 0
    }
  )
}
