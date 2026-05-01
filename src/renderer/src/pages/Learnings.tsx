import { useEffect, useState } from 'react'
import type { Learning, LearningKategorie } from '../types'
import { Lightbulb, Plus, Trash2, Pencil, CheckCircle2, AlertCircle, Sparkles, Calendar } from 'lucide-react'
import Modal, { ConfirmModal } from '../components/UI/Modal'
import { DatePicker } from '../components/UI/DatePicker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/UI/Select'
import { cn, formatDate, todayISO } from '../lib/utils'
import { useActiveSaison } from '../store/saisonStore'
import { toast } from 'sonner'

const KAT_STYLES: Record<LearningKategorie, string> = {
  positiv:     'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  negativ:     'bg-red-900/40 text-red-300 border-red-700/40',
  verbesserung:'bg-orange-900/40 text-orange-300 border-orange-700/40',
}
const KAT_LABELS: Record<LearningKategorie, string> = {
  positiv: 'Positiv', negativ: 'Negativ', verbesserung: 'Verbesserung'
}
const KAT_ICONS: Record<LearningKategorie, any> = {
  positiv: CheckCircle2,
  negativ: AlertCircle,
  verbesserung: Sparkles
}

const inputClass = "w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-alpine-400 focus:border-alpine-400 transition-all placeholder:text-muted-foreground/30"

export default function Learnings() {
  const activeSaison = useActiveSaison()
  const [learnings, setLearnings] = useState<Learning[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Learning> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Learning | null>(null)
  const [filterKat, setFilterKat] = useState<LearningKategorie | 'alle'>('alle')

  const load = async () => {
    setLoading(true)
    const data = await window.api.getLearnings(activeSaison?.id) as Learning[]
    setLearnings(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing) return
    try {
      await window.api.saveLearning({ ...editing, saison_id: activeSaison?.id } as any)
      setModal(false); setEditing(null); load()
      toast.success('Learning gespeichert')
    } catch (e) {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await window.api.deleteLearning(deleteTarget.id)
      setDeleteTarget(null)
      load()
      toast.success('Learning gelöscht')
    } catch (e) {
      toast.error('Fehler beim Löschen')
    }
  }

  const visible = filterKat === 'alle' ? learnings : learnings.filter(l => l.kategorie === filterKat)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Erkenntnisse & Learnings</h1>
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
          const Icon = KAT_ICONS[k]
          return (
            <button key={k} onClick={() => setFilterKat(filterKat === k ? 'alle' : k)}
              className={cn('alpine-card p-4 text-center transition-all hover:scale-[1.01]',
                filterKat === k && 'ring-1 ring-alpine-400/50')}>
              <Icon className={cn("w-6 h-6 mx-auto mb-1", k === 'positiv' ? 'text-emerald-400' : k === 'negativ' ? 'text-red-400' : 'text-orange-400')} />
              <p className="text-xl font-display font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{KAT_LABELS[k]}</p>
            </button>
          )
        })}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {loading && <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Laden…</div>}
        {!loading && visible.length === 0 && (
          <div className="alpine-card p-8 text-center text-muted-foreground text-sm">
            <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Noch keine Einträge.
          </div>
        )}
        {!loading && visible.map(l => {
          const Icon = KAT_ICONS[l.kategorie]
          return (
            <div key={l.id} className="alpine-card p-4 flex items-start gap-4 group">
              <div className="shrink-0 mt-1">
                <Icon className={cn("w-5 h-5", l.kategorie === 'positiv' ? 'text-emerald-400' : l.kategorie === 'negativ' ? 'text-red-400' : 'text-orange-400')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground truncate">{l.titel}</p>
                  <span className={cn('text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0', KAT_STYLES[l.kategorie])}>
                    {KAT_LABELS[l.kategorie]}
                  </span>
                </div>
                {l.beschreibung && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{l.beschreibung}</p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-1.5 uppercase font-medium">
                  <Calendar className="w-3 h-3" />
                  {formatDate(l.datum)}
                </div>
              </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(l); setModal(true) }} className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(l)} className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
            </div>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} title={editing?.id ? 'Learning bearbeiten' : 'Neues Learning'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Titel *</label>
              <input className={inputClass} placeholder="z.B. Wetterabhängigkeit, Materialmangel, …" value={editing.titel ?? ''} onChange={e => setEditing(p => ({ ...p, titel: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Kategorie</label>
                <Select value={editing.kategorie} onValueChange={v => setEditing(p => ({ ...p, kategorie: v as LearningKategorie }))}>
                  <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>
                    {(['positiv', 'negativ', 'verbesserung'] as const).map(k => (
                      <SelectItem key={k} value={k}>{KAT_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DatePicker label="Datum" value={editing.datum} onChange={e => setEditing(p => ({ ...p, datum: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Beschreibung</label>
              <textarea className={cn(inputClass, "resize-none")} rows={5} value={editing.beschreibung ?? ''} onChange={e => setEditing(p => ({ ...p, beschreibung: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-border/40 mt-6">
              <button onClick={() => { setModal(false); setEditing(null) }} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={save} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Learning löschen"
        message={`Möchtest du dieses Learning wirklich unwiderruflich löschen?`}
      />
    </div>
  )
}
