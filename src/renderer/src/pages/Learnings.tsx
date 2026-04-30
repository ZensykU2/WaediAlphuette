import { useEffect, useState } from 'react'
import type { Learning, LearningKategorie } from '../types'
import { Lightbulb, Plus, Trash2, Pencil } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn, formatDate, todayISO } from '../lib/utils'
import { useActiveSaison } from '../store/saisonStore'

const KAT_STYLES: Record<LearningKategorie, string> = {
  positiv:     'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  negativ:     'bg-red-900/40 text-red-300 border-red-700/40',
  verbesserung:'bg-orange-900/40 text-orange-300 border-orange-700/40',
}
const KAT_LABELS: Record<LearningKategorie, string> = {
  positiv: 'Positiv', negativ: 'Negativ', verbesserung: 'Verbesserung'
}
const KAT_ICON: Record<LearningKategorie, string> = {
  positiv: '✅', negativ: '❌', verbesserung: '💡'
}

export default function Learnings() {
  const activeSaison = useActiveSaison()
  const [learnings, setLearnings] = useState<Learning[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Learning> | null>(null)
  const [filterKat, setFilterKat] = useState<LearningKategorie | 'alle'>('alle')

  const load = async () => {
    const data = await window.api.getLearnings(activeSaison?.id) as Learning[]
    setLearnings(data)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing) return
    await window.api.saveLearning({ ...editing, saison_id: activeSaison?.id } as any)
    setModal(false); setEditing(null); load()
  }

  const visible = filterKat === 'alle' ? learnings : learnings.filter(l => l.kategorie === filterKat)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Learnings & Fazit</h1>
          <p className="text-sm text-muted-foreground mt-1">Erfahrungen dokumentieren · Verbesserungen festhalten</p>
        </div>
        <button onClick={() => { setEditing({ kategorie: 'positiv', datum: todayISO() }); setModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Learning erfassen
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {(['positiv', 'negativ', 'verbesserung'] as LearningKategorie[]).map(k => {
          const count = learnings.filter(l => l.kategorie === k).length
          return (
            <button key={k} onClick={() => setFilterKat(filterKat === k ? 'alle' : k)}
              className={cn('alpine-card p-4 text-center transition-all hover:scale-[1.01]',
                filterKat === k && 'ring-1 ring-alpine-400/50')}>
              <p className="text-2xl mb-1">{KAT_ICON[k]}</p>
              <p className="text-xl font-display font-bold">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{KAT_LABELS[k]}</p>
            </button>
          )
        })}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="alpine-card p-8 text-center text-muted-foreground text-sm">
            <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Noch keine Einträge.
          </div>
        )}
        {visible.map(l => (
          <div key={l.id} className="alpine-card p-4 flex items-start gap-4 group">
            <div className="text-2xl shrink-0 mt-0.5">{KAT_ICON[l.kategorie]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground truncate">{l.titel}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', KAT_STYLES[l.kategorie])}>
                  {KAT_LABELS[l.kategorie]}
                </span>
              </div>
              {l.beschreibung && (
                <p className="text-sm text-muted-foreground leading-relaxed">{l.beschreibung}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(l.datum)}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => { setEditing(l); setModal(true) }}
                className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={async () => { await window.api.deleteLearning(l.id); load() }}
                className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }}
        title={editing?.id ? 'Learning bearbeiten' : 'Neuer Learning'}>
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kategorie</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.kategorie ?? 'positiv'}
                  onChange={e => setEditing(p => ({ ...p, kategorie: e.target.value as LearningKategorie }))}>
                  <option value="positiv">✅ Positiv</option>
                  <option value="negativ">❌ Negativ</option>
                  <option value="verbesserung">💡 Verbesserung</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Datum</label>
                <input type="date" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.datum ?? todayISO()}
                  onChange={e => setEditing(p => ({ ...p, datum: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Titel *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                placeholder="Kurze Zusammenfassung…"
                value={editing.titel ?? ''}
                onChange={e => setEditing(p => ({ ...p, titel: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Beschreibung</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={4}
                placeholder="Details, Kontext, Verbesserungsvorschläge…"
                value={editing.beschreibung ?? ''}
                onChange={e => setEditing(p => ({ ...p, beschreibung: e.target.value }))} />
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
