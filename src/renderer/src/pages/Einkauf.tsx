import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Einkaufsitem, EinkaufKategorie } from '../types'
import { Plus, Trash2, AlertCircle, Check } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn } from '../lib/utils'

const KATEGORIEN: { value: EinkaufKategorie; label: string; color: string }[] = [
  { value: 'lebensmittel', label: 'Lebensmittel', color: 'bg-green-900/40 text-green-300 border-green-700/40' },
  { value: 'getraenke',    label: 'Getränke',      color: 'bg-blue-900/40 text-blue-300 border-blue-700/40' },
  { value: 'material',     label: 'Material',      color: 'bg-purple-900/40 text-purple-300 border-purple-700/40' },
  { value: 'sonstiges',    label: 'Sonstiges',     color: 'bg-stone-700/60 text-stone-300 border-stone-600/40' },
]

const EINHEITEN = ['kg', 'g', 'L', 'dl', 'ml', 'Stk', 'Pkg', 'Dose', 'Flasche', 'Karton']

export default function Einkauf() {
  const activeSaison = useActiveSaison()
  const [items, setItems] = useState<Einkaufsitem[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Einkaufsitem> | null>(null)
  const [filterKat, setFilterKat] = useState<EinkaufKategorie | 'alle'>('alle')

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const data = await window.api.getEinkaufsliste(activeSaison.id)
    setItems(data as Einkaufsitem[])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing || !activeSaison) return
    await window.api.saveEinkaufsitem({ ...editing, saison_id: activeSaison.id } as any)
    setModal(false); setEditing(null); load()
  }

  const toggle = async (id: number) => {
    await window.api.toggleEinkaufsitemBesorgt(id)
    load()
  }

  const visible = filterKat === 'alle' ? items : items.filter(i => i.kategorie === filterKat)
  const offenCount = items.filter(i => !i.besorgt).length
  const besorgtCount = items.filter(i => i.besorgt).length

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
          <h1 className="page-title">Einkaufsliste</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {offenCount} offen · {besorgtCount} besorgt
          </p>
        </div>
        <button onClick={() => { setEditing({ kategorie: 'lebensmittel', besorgt: 0 }); setModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Artikel hinzufügen
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterKat('alle')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            filterKat === 'alle' ? 'bg-alpine-400/20 text-alpine-400 border-alpine-400/40' : 'border-border text-muted-foreground hover:text-foreground hover:border-stone-600')}>
          Alle ({items.length})
        </button>
        {KATEGORIEN.map(k => {
          const count = items.filter(i => i.kategorie === k.value).length
          return (
            <button key={k.value} onClick={() => setFilterKat(k.value)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filterKat === k.value ? k.color : 'border-border text-muted-foreground hover:text-foreground hover:border-stone-600')}>
              {k.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Items by category */}
      {loading ? (
        <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Laden…</div>
      ) : visible.length === 0 ? (
        <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Noch keine Artikel.</div>
      ) : (
        <div className="alpine-card overflow-hidden">
          {visible.map((item, idx) => {
            const kat = KATEGORIEN.find(k => k.value === item.kategorie)
            return (
              <div key={item.id} className={cn(
                'flex items-center gap-3 px-4 py-3 group',
                idx < visible.length - 1 && 'border-b border-border/50',
                item.besorgt && 'opacity-50'
              )}>
                <button onClick={() => toggle(item.id)}
                  className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                    item.besorgt ? 'bg-emerald-500 border-emerald-500' : 'border-border hover:border-alpine-400')}>
                  {item.besorgt ? <Check className="w-3 h-3 text-white" /> : null}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', item.besorgt && 'line-through')}>{item.artikel}</span>
                    {item.menge ? <span className="text-xs text-muted-foreground">{item.menge} {item.einheit ?? ''}</span> : null}
                  </div>
                  {item.notiz && <p className="text-xs text-muted-foreground truncate">{item.notiz}</p>}
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', kat?.color)}>
                  {kat?.label}
                </span>
                <button onClick={async () => { await window.api.deleteEinkaufsitem(item.id); load() }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }}
        title="Artikel hinzufügen">
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Artikel *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                placeholder="z.B. Mehl, Tomaten, …"
                value={editing.artikel ?? ''}
                onChange={e => setEditing(p => ({ ...p, artikel: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">Menge</label>
                <input type="number" step="0.1" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.menge ?? ''}
                  onChange={e => setEditing(p => ({ ...p, menge: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div className="col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">Einheit</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.einheit ?? ''}
                  onChange={e => setEditing(p => ({ ...p, einheit: e.target.value || undefined }))}>
                  <option value="">—</option>
                  {EINHEITEN.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">Kategorie</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.kategorie ?? 'lebensmittel'}
                  onChange={e => setEditing(p => ({ ...p, kategorie: e.target.value as EinkaufKategorie }))}>
                  {KATEGORIEN.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notiz</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                placeholder="Optional"
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
