import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Anlass, AnlassStatus } from '../types'
import { formatDate, todayISO } from '../lib/utils'
import { Plus, Trash2, Pencil, AlertCircle, Pin, Users } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn } from '../lib/utils'

const STATUS_STYLES: Record<AnlassStatus, string> = {
  geplant: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  bestaetigt: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  abgesagt: 'bg-red-900/40 text-red-300 border-red-700/40',
}
const STATUS_LABELS: Record<AnlassStatus, string> = {
  geplant: 'Geplant', bestaetigt: 'Bestätigt', abgesagt: 'Abgesagt',
}

export default function Anlaesse() {
  const activeSaison = useActiveSaison()
  const [anlaesse, setAnlaesse] = useState<Anlass[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Anlass> | null>(null)

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const data = await window.api.getAnlaesse(activeSaison.id)
    setAnlaesse(data as Anlass[])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing || !activeSaison) return
    await window.api.saveAnlass({ ...editing, saison_id: activeSaison.id } as any)
    setModal(false); setEditing(null); load()
  }

  if (!activeSaison) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
      <p className="text-lg font-display font-semibold">Keine Saison aktiv</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Anlässe & Gäste</h1>
          <p className="text-sm text-muted-foreground mt-1">Geplante Anlässe und Buchungsübersicht</p>
        </div>
        <button onClick={() => {
          setEditing({ datum: todayISO(), typ: 'verein', status: 'geplant', personenzahl_min: 1, kegelbahn: 0 })
          setModal(true)
        }} className="btn-primary">
          <Plus className="w-4 h-4" /> Anlass erfassen
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['geplant', 'bestaetigt', 'abgesagt'] as AnlassStatus[]).map(s => {
          const count = anlaesse.filter(a => a.status === s).length
          return (
            <div key={s} className="alpine-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{STATUS_LABELS[s]}</p>
            </div>
          )
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Laden…</div>}
        {!loading && anlaesse.length === 0 && (
          <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Noch keine Anlässe erfasst.</div>
        )}
        {anlaesse.map(a => (
          <div key={a.id} className="alpine-card p-4 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 text-center">
              <p className="text-alpine-400 font-display font-bold text-lg leading-tight">
                {new Date(a.datum + 'T00:00:00').getDate().toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(a.datum + 'T00:00:00').toLocaleDateString('de-CH', { month: 'short' })}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-foreground truncate">{a.gruppe}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', STATUS_STYLES[a.status])}>
                  {STATUS_LABELS[a.status]}
                </span>
                {a.kegelbahn ? (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-forest-700 text-stone-300 border-border">
                    <Pin className="w-3 h-3 inline mr-1" />Kegelbahn
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {a.personenzahl_min}{a.personenzahl_max ? `–${a.personenzahl_max}` : ''} Personen
                </span>
                {a.kegelbahn && a.preis_pro_stunde ? (
                  <span>CHF {a.preis_pro_stunde.toFixed(2)} / Std.</span>
                ) : null}
                {a.notiz && <span className="italic truncate max-w-[200px]">{a.notiz}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setEditing(a); setModal(true) }}
                className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={async () => { await window.api.deleteAnlass(a.id); load() }}
                className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }}
        title={editing?.id ? 'Anlass bearbeiten' : 'Neuer Anlass'}>
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Datum *</label>
                <input type="date" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.datum ?? todayISO()}
                  onChange={e => setEditing(p => ({ ...p, datum: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Typ</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.typ ?? 'verein'}
                  onChange={e => setEditing(p => ({ ...p, typ: e.target.value as any }))}>
                  <option value="verein">Verein</option>
                  <option value="privat">Privat</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gruppe / Name *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                placeholder="z.B. Turnverein Emmenstrand"
                value={editing.gruppe ?? ''}
                onChange={e => setEditing(p => ({ ...p, gruppe: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Personen min *</label>
                <input type="number" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.personenzahl_min ?? 1}
                  onChange={e => setEditing(p => ({ ...p, personenzahl_min: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Personen max</label>
                <input type="number" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.personenzahl_max ?? ''}
                  onChange={e => setEditing(p => ({ ...p, personenzahl_max: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-alpine-400 w-4 h-4"
                  checked={!!editing.kegelbahn}
                  onChange={e => setEditing(p => ({ ...p, kegelbahn: e.target.checked ? 1 : 0 }))} />
                <span className="text-sm">Kegelbahn</span>
              </label>
              {editing.kegelbahn ? (
                <div className="flex-1">
                  <input type="number" step="0.5" placeholder="CHF / Stunde"
                    className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                    value={editing.preis_pro_stunde ?? ''}
                    onChange={e => setEditing(p => ({ ...p, preis_pro_stunde: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={editing.status ?? 'geplant'}
                onChange={e => setEditing(p => ({ ...p, status: e.target.value as AnlassStatus }))}>
                <option value="geplant">Geplant</option>
                <option value="bestaetigt">Bestätigt</option>
                <option value="abgesagt">Abgesagt</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notiz</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={2}
                value={editing.notiz ?? ''}
                onChange={e => setEditing(p => ({ ...p, notiz: e.target.value }))} />
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
