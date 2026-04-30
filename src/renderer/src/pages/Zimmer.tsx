import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Zimmer, ZimmerBelegung } from '../types'
import { formatDate, todayISO } from '../lib/utils'
import { BedDouble, Plus, Trash2, Pencil, AlertCircle, AlertTriangle } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn } from '../lib/utils'

const TYP_LABELS: Record<string, string> = {
  '6er': '6er-Zimmer', '5er': '5er-Zimmer',
  '4er': '4er-Zimmer', 'huettenwart': 'Hüttenwartszimmer'
}
const TYP_COLORS: Record<string, string> = {
  '6er': 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  '5er': 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  '4er': 'bg-teal-900/40 text-teal-300 border-teal-700/40',
  'huettenwart': 'bg-alpine-400/15 text-alpine-400 border-alpine-400/30',
}

function isOverlapping(a: ZimmerBelegung, b: ZimmerBelegung): boolean {
  if (a.id === b.id) return false
  if (a.zimmer_id !== b.zimmer_id) return false
  return a.datum_von <= b.datum_bis && a.datum_bis >= b.datum_von
}

export default function Zimmer() {
  const activeSaison = useActiveSaison()
  const [zimmer, setZimmer] = useState<Zimmer[]>([])
  const [belegungen, setBelegungen] = useState<ZimmerBelegung[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<ZimmerBelegung> | null>(null)

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const [z, b] = await Promise.all([
      window.api.getAllZimmer(),
      window.api.getZimmerBelegung(activeSaison.id),
    ])
    setZimmer(z as Zimmer[])
    setBelegungen(b as ZimmerBelegung[])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing || !activeSaison) return
    await window.api.saveZimmerBelegung({ ...editing, saison_id: activeSaison.id } as any)
    setModal(false); setEditing(null); load()
  }

  const conflicts = new Set<number>()
  for (let i = 0; i < belegungen.length; i++) {
    for (let j = i + 1; j < belegungen.length; j++) {
      if (isOverlapping(belegungen[i], belegungen[j])) {
        conflicts.add(belegungen[i].id)
        conflicts.add(belegungen[j].id)
      }
    }
  }

  if (!activeSaison) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-lg font-display font-semibold">Keine Saison aktiv</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Zimmer</h1>
          <p className="text-sm text-muted-foreground mt-1">Reservation & Belegungsübersicht</p>
        </div>
        <button onClick={() => { setEditing({ datum_von: todayISO(), datum_bis: todayISO(), typ: 'gast' }); setModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Belegung erfassen
        </button>
      </div>

      {/* Zimmer stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {zimmer.map(z => {
          const belegt = belegungen.filter(b => b.zimmer_id === z.id).length
          return (
            <div key={z.id} className="alpine-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', TYP_COLORS[z.typ])}>
                  {TYP_LABELS[z.typ]}
                </span>
                <BedDouble className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground">{z.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{z.kapazitaet} Plätze · {belegt} Buchungen</p>
            </div>
          )
        })}
      </div>

      {/* Belegungliste */}
      <div className="alpine-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Belegungsplan</h2>
          {conflicts.size > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 border border-red-800/40 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" /> {conflicts.size} Konflikte
            </span>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Laden…</div>
        ) : belegungen.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Noch keine Belegungen erfasst.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Zimmer</th>
                <th className="px-4 py-3 text-left">Gast / Helfer</th>
                <th className="px-4 py-3 text-left">Von</th>
                <th className="px-4 py-3 text-left">Bis</th>
                <th className="px-4 py-3 text-left">Typ</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {belegungen.map(b => (
                <tr key={b.id} className={cn(
                  'border-b border-border/50 hover:bg-forest-800/50 transition-colors',
                  conflicts.has(b.id) && 'bg-red-900/10'
                )}>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', TYP_COLORS[b.zimmer_typ ?? '6er'])}>
                      {b.zimmer_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {conflicts.has(b.id) && <AlertTriangle className="w-3 h-3 text-red-400 inline mr-1" />}
                    {b.gast_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(b.datum_von)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(b.datum_bis)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border',
                      b.typ === 'gast' ? 'badge-verein' : 'bg-orange-900/40 text-orange-300 border-orange-700/40')}>
                      {b.typ === 'gast' ? 'Gast' : 'Helfer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(b); setModal(true) }}
                        className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={async () => { await window.api.deleteZimmerBelegung(b.id); load() }}
                        className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }}
        title={editing?.id ? 'Belegung bearbeiten' : 'Neue Belegung'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Zimmer *</label>
              <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={editing.zimmer_id ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, zimmer_id: Number(e.target.value) }))}>
                <option value="">Zimmer wählen…</option>
                {zimmer.map(z => <option key={z.id} value={z.id}>{z.name} ({z.typ}, {z.kapazitaet} Plätze)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gast / Helfer Name *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={editing.gast_name ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, gast_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Von *</label>
                <input type="date" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.datum_von ?? todayISO()}
                  onChange={e => setEditing(prev => ({ ...prev, datum_von: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bis *</label>
                <input type="date" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.datum_bis ?? todayISO()}
                  onChange={e => setEditing(prev => ({ ...prev, datum_bis: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Typ</label>
              <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={editing.typ ?? 'gast'}
                onChange={e => setEditing(prev => ({ ...prev, typ: e.target.value as 'gast' | 'helfer' }))}>
                <option value="gast">Gast</option>
                <option value="helfer">Helfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notiz</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={2}
                value={editing.notiz ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, notiz: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setModal(false); setEditing(null) }} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={save} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
