import { useEffect, useState } from 'react'
import { Save, Info } from 'lucide-react'
import { useActiveSaison } from '../store/saisonStore'
import type { BudgetPlanItem } from '../types'
import { formatCHF } from '../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const KATEGORIEN = [
  { key: 'speisen_einnahmen',     label: 'Einnahmen: Speisen' },
  { key: 'getraenke_einnahmen',   label: 'Einnahmen: Getränke' },
  { key: 'uebernachtung_einnahmen', label: 'Einnahmen: Übernachtungen' },
  { key: 'lebensmittel_ausgaben', label: 'Ausgaben: Lebensmittel' },
  { key: 'dekoration_ausgaben',   label: 'Ausgaben: Dekoration' },
  { key: 'anschaffung_ausgaben',  label: 'Ausgaben: Anschaffungen' },
  { key: 'sonstiges_ausgaben',    label: 'Ausgaben: Sonstiges' },
  { key: 'vorkosten',             label: 'Vorkosten / Vorfinanzierung' },
]

export default function Budgetplanung() {
  const activeSaison = useActiveSaison()
  const [plan, setPlan] = useState<Record<string, string>>({})
  const [actuals, setActuals] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!activeSaison) return
    window.api.getBudgetPlan(activeSaison.id).then((items: any[]) => {
      const map: Record<string, string> = {}
      for (const item of items) map[item.kategorie] = String(item.betrag_geplant)
      setPlan(map)
    })
    window.api.getGesamtauswertung(activeSaison.id).then((data: any) => {
      const a: Record<string, number> = {}
      for (const e of data.einByKat ?? []) a[`${e.kategorie}_einnahmen`] = e.brutto
      for (const x of data.ausByKat ?? []) {
        const key = `${x.kategorie}_ausgaben`
        a[key] = (a[key] ?? 0) + x.total
      }
      setActuals(a)
    })
  }, [activeSaison?.id])

  const save = async () => {
    if (!activeSaison) return
    setSaving(true)
    const items: BudgetPlanItem[] = KATEGORIEN.map(k => ({
      saison_id: activeSaison.id,
      kategorie: k.key,
      betrag_geplant: parseFloat(plan[k.key] ?? '0') || 0
    }))
    await window.api.saveBudgetPlan(items)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const chartData = KATEGORIEN.map(k => ({
    name: k.label.replace(/^(Einnahmen|Ausgaben): /, ''),
    Geplant: parseFloat(plan[k.key] ?? '0') || 0,
    Effektiv: actuals[k.key] ?? 0
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgetplanung</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activeSaison?.name} {activeSaison?.jahr}</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-alpine-400 hover:bg-alpine-500 text-forest-900 font-medium text-sm transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saved ? 'Gespeichert ✓' : saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      <div className="flex gap-2 p-3 rounded-lg bg-blue-950/30 border border-blue-700/30 text-xs text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Trage hier die geplanten Beträge für die Saison ein. Der Vergleich mit den effektiven Zahlen erscheint im Diagramm unten.</p>
      </div>

      {/* Budget Input Grid */}
      <div className="alpine-card divide-y divide-border">
        <div className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Position</span>
          <span className="text-right">Geplant (CHF)</span>
          <span className="text-right">Effektiv (CHF)</span>
        </div>
        {KATEGORIEN.map(({ key, label }) => {
          const geplant = parseFloat(plan[key] ?? '0') || 0
          const effektiv = actuals[key] ?? 0
          const diff = effektiv - geplant
          return (
            <div key={key} className="grid grid-cols-3 items-center px-4 py-3 hover:bg-forest-700/30 transition-colors">
              <span className="text-sm text-foreground">{label}</span>
              <div className="flex justify-end">
                <input
                  type="number" step="10" min="0"
                  value={plan[key] ?? ''}
                  onChange={e => setPlan(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="0.00"
                  className="w-32 px-3 py-1.5 rounded-md bg-forest-900 border border-border text-foreground text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-alpine-400"
                />
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-sm tabular-nums">{formatCHF(effektiv)}</p>
                {geplant > 0 && (
                  <p className={`text-xs tabular-nums ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {diff > 0 ? '+' : ''}{formatCHF(diff)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Chart */}
      <div className="alpine-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Geplant vs. Effektiv</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(80 8% 22%)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9c9784', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#9c9784', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} width={55} />
            <Tooltip contentStyle={{ background: '#252920', border: '1px solid hsl(80 8% 22%)', borderRadius: '8px', color: '#f0ede4', fontSize: '12px' }}
              formatter={(v: number) => formatCHF(v)} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#9c9784', paddingTop: '8px' }} />
            <Bar dataKey="Geplant" fill="#8ea86b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Effektiv" fill="#d4a24a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
