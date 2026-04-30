import { useEffect, useState } from 'react'
import type { Rezept, RezeptZutat } from '../types'
import { BookOpen, Plus, Trash2, Pencil, Clock, Users, ChevronRight, X, ShoppingCart } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn } from '../lib/utils'
import { useActiveSaison } from '../store/saisonStore'

interface RezeptWithZutaten extends Rezept { zutaten: RezeptZutat[] }

export default function Rezepte() {
  const activeSaison = useActiveSaison()
  const [rezepte, setRezepte] = useState<RezeptWithZutaten[]>([])
  const [selected, setSelected] = useState<RezeptWithZutaten | null>(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Rezept> | null>(null)
  const [zutaten, setZutaten] = useState<Partial<RezeptZutat>[]>([])
  const [personenFaktor, setPersonenFaktor] = useState(1)
  const [einkaufMsg, setEinkaufMsg] = useState<string | null>(null)

  const load = async () => {
    const data = await window.api.getAllRezepte() as Rezept[]
    const withZ = await Promise.all(data.map(async r => ({
      ...r, zutaten: await window.api.getRezeptZutaten(r.id) as RezeptZutat[]
    })))
    setRezepte(withZ)
    if (selected) {
      const updated = withZ.find(r => r.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing({ basis_personen: 4 })
    setZutaten([{ artikel: '', menge: 0, einheit: '' }])
    setModal(true)
  }

  const openEdit = (r: RezeptWithZutaten) => {
    setEditing(r)
    setZutaten(r.zutaten.length ? r.zutaten : [{ artikel: '', menge: 0, einheit: '' }])
    setModal(true)
  }

  const save = async () => {
    if (!editing) return
    const saved = await window.api.saveRezept(editing as any) as Rezept
    const validZutaten = zutaten.filter(z => z.artikel?.trim())
    await window.api.saveRezeptZutaten(saved.id, validZutaten as RezeptZutat[])
    setModal(false); setEditing(null); load()
  }

  const addToEinkauf = async () => {
    if (!selected || !activeSaison) return
    const faktor = personenFaktor / (selected.basis_personen || 1)
    for (const z of selected.zutaten) {
      await window.api.saveEinkaufsitem({
        saison_id: activeSaison.id,
        kategorie: 'lebensmittel',
        artikel: z.artikel,
        menge: Math.round(z.menge * faktor * 100) / 100,
        einheit: z.einheit,
      } as any)
    }
    setEinkaufMsg(`${selected.zutaten.length} Zutaten zur Einkaufsliste hinzugefügt!`)
    setTimeout(() => setEinkaufMsg(null), 3000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Rezepte</h1>
          <p className="text-sm text-muted-foreground mt-1">Standardisierte Rezepte mit Mengenrechner</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" /> Neues Rezept
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-13rem)]">
        {/* List panel */}
        <div className="alpine-card overflow-y-auto">
          {rezepte.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">Noch keine Rezepte.</div>
          )}
          {rezepte.map(r => (
            <button key={r.id} onClick={() => { setSelected(r); setPersonenFaktor(r.basis_personen) }}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-forest-700/50 transition-colors flex items-center gap-3 group',
                selected?.id === r.id && 'bg-alpine-400/10 border-l-2 border-l-alpine-400'
              )}>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.titel}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.basis_personen}</span>
                  {r.zeitaufwand_min && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.zeitaufwand_min} Min.</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="alpine-card overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{selected.titel}</h2>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />Basis: {selected.basis_personen} Personen</span>
                  {selected.zeitaufwand_min && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selected.zeitaufwand_min} Min.</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selected)}
                  className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={async () => { await window.api.deleteRezept(selected.id); setSelected(null); load() }}
                  className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scaling calculator */}
            <div className="bg-forest-800 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Mengenrechner</p>
                {einkaufMsg && <p className="text-xs text-emerald-400">{einkaufMsg}</p>}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Personen:</label>
                <input type="number" min={1} step={1}
                  className="w-24 bg-forest-900 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                  value={personenFaktor}
                  onChange={e => setPersonenFaktor(Math.max(1, Number(e.target.value)))} />
                <span className="text-xs text-muted-foreground">(Basis: {selected.basis_personen})</span>
                {activeSaison && selected.zutaten.length > 0 && (
                  <button onClick={addToEinkauf} className="btn-secondary text-xs ml-auto">
                    <ShoppingCart className="w-3.5 h-3.5" /> Auf Einkaufsliste
                  </button>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {selected.zutaten.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Zutaten</h3>
                <div className="space-y-1">
                  {selected.zutaten.map(z => {
                    const skaliert = Math.round(z.menge * (personenFaktor / selected.basis_personen) * 100) / 100
                    return (
                      <div key={z.id} className="flex items-center gap-3 text-sm py-1 border-b border-border/30">
                        <span className="font-tabular-nums text-alpine-400 w-20 shrink-0">
                          {skaliert} {z.einheit ?? ''}
                        </span>
                        <span className="text-foreground">{z.artikel}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Zubereitung */}
            {selected.zubereitung && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Zubereitung</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selected.zubereitung}</p>
              </div>
            )}

            {selected.notiz && (
              <div className="bg-alpine-400/5 border border-alpine-400/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">{selected.notiz}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="alpine-card flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Rezept auswählen</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }}
        title={editing?.id ? 'Rezept bearbeiten' : 'Neuer Rezept'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Titel *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={editing.titel ?? ''}
                onChange={e => setEditing(p => ({ ...p, titel: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Basis Personen *</label>
                <input type="number" min={1} className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.basis_personen ?? 4}
                  onChange={e => setEditing(p => ({ ...p, basis_personen: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zeitaufwand (Min.)</label>
                <input type="number" min={0} className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.zeitaufwand_min ?? ''}
                  onChange={e => setEditing(p => ({ ...p, zeitaufwand_min: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Zutaten</label>
                <button type="button" onClick={() => setZutaten(p => [...p, { artikel: '', menge: 0, einheit: '' }])}
                  className="text-xs text-alpine-400 hover:underline">+ Zutat</button>
              </div>
              <div className="space-y-2">
                {zutaten.map((z, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="number" step="0.1" placeholder="Menge"
                      className="w-20 shrink-0 bg-forest-800 border border-border rounded-md px-2 py-1.5 text-sm text-foreground"
                      value={z.menge ?? ''}
                      onChange={e => setZutaten(p => p.map((x, i) => i === idx ? { ...x, menge: Number(e.target.value) } : x))} />
                    <input placeholder="Einheit"
                      className="w-20 shrink-0 bg-forest-800 border border-border rounded-md px-2 py-1.5 text-sm text-foreground"
                      value={z.einheit ?? ''}
                      onChange={e => setZutaten(p => p.map((x, i) => i === idx ? { ...x, einheit: e.target.value } : x))} />
                    <input placeholder="Artikel"
                      className="flex-1 bg-forest-800 border border-border rounded-md px-2 py-1.5 text-sm text-foreground"
                      value={z.artikel ?? ''}
                      onChange={e => setZutaten(p => p.map((x, i) => i === idx ? { ...x, artikel: e.target.value } : x))} />
                    <button type="button" onClick={() => setZutaten(p => p.filter((_, i) => i !== idx))}
                      className="p-1 text-muted-foreground hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Zubereitung</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={4}
                value={editing.zubereitung ?? ''}
                onChange={e => setEditing(p => ({ ...p, zubereitung: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notiz</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
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
