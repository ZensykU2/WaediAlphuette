import { useEffect, useState } from 'react'
import type { Todo, TodoPrioritaet, TodoStatus } from '../types'
import { CheckSquare, Plus, Trash2, AlertCircle, Clock } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn, formatDate, todayISO } from '../lib/utils'
import { useActiveSaison } from '../store/saisonStore'

const PRIO_STYLES: Record<TodoPrioritaet, string> = {
  hoch:   'bg-red-900/40 text-red-300 border-red-700/40',
  mittel: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  tief:   'bg-green-900/40 text-green-300 border-green-700/40',
}
const STATUS_STYLES: Record<TodoStatus, string> = {
  offen:     'bg-stone-700/60 text-stone-300 border-stone-600/40',
  in_arbeit: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  erledigt:  'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
}
const STATUS_LABELS: Record<TodoStatus, string> = {
  offen: 'Offen', in_arbeit: 'In Arbeit', erledigt: 'Erledigt'
}
const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  offen: 'in_arbeit', in_arbeit: 'erledigt', erledigt: 'offen'
}

export default function Todos() {
  const activeSaison = useActiveSaison()
  const [todos, setTodos] = useState<Todo[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Todo> | null>(null)
  const [filterStatus, setFilterStatus] = useState<TodoStatus | 'alle'>('alle')

  const load = async () => {
    const data = await window.api.getTodos(activeSaison?.id) as Todo[]
    setTodos(data)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing) return
    await window.api.saveTodo({ ...editing, saison_id: activeSaison?.id } as any)
    setModal(false); setEditing(null); load()
  }

  const cycleStatus = async (t: Todo) => {
    const next = STATUS_CYCLE[t.status]
    await window.api.saveTodo({ ...t, status: next })
    load()
  }

  const today = todayISO()
  const visible = filterStatus === 'alle' ? todos : todos.filter(t => t.status === filterStatus)
  const overdueCount = todos.filter(t => t.faellig_am && t.faellig_am < today && t.status !== 'erledigt').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">To-dos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {todos.filter(t => t.status !== 'erledigt').length} offen
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} überfällig</span>}
          </p>
        </div>
        <button onClick={() => { setEditing({ prioritaet: 'mittel', status: 'offen' }); setModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Aufgabe
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-forest-800 rounded-lg p-1 w-fit">
        {(['alle', 'offen', 'in_arbeit', 'erledigt'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              filterStatus === s ? 'bg-alpine-400/20 text-alpine-400' : 'text-muted-foreground hover:text-foreground')}>
            {s === 'alle' ? 'Alle' : STATUS_LABELS[s as TodoStatus]}
          </button>
        ))}
      </div>

      {/* Todo list grouped by priority */}
      {(['hoch', 'mittel', 'tief'] as TodoPrioritaet[]).map(prio => {
        const group = visible.filter(t => t.prioritaet === prio)
        if (group.length === 0) return null
        return (
          <div key={prio}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PRIO_STYLES[prio])}>
                {prio.charAt(0).toUpperCase() + prio.slice(1)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {group.map(t => {
                const isOverdue = t.faellig_am && t.faellig_am < today && t.status !== 'erledigt'
                return (
                  <div key={t.id} className={cn(
                    'alpine-card px-4 py-3 flex items-start gap-3 group',
                    t.status === 'erledigt' && 'opacity-50'
                  )}>
                    <button onClick={() => cycleStatus(t)}
                      className={cn('mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold transition-all',
                        t.status === 'erledigt' ? 'bg-emerald-500 border-emerald-500 text-white' :
                        t.status === 'in_arbeit' ? 'border-blue-500 text-blue-400' :
                        'border-border hover:border-alpine-400'
                      )}>
                      {t.status === 'erledigt' ? '✓' : t.status === 'in_arbeit' ? '→' : ''}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-sm font-medium', t.status === 'erledigt' && 'line-through')}>{t.titel}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border', STATUS_STYLES[t.status])}>
                          {STATUS_LABELS[t.status]}
                        </span>
                      </div>
                      {t.beschreibung && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.beschreibung}</p>}
                      {t.faellig_am && (
                        <p className={cn('text-xs mt-0.5 flex items-center gap-1', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                          <Clock className="w-3 h-3" /> {isOverdue ? '⚠ Überfällig · ' : ''}{formatDate(t.faellig_am)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditing(t); setModal(true) }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-forest-700 transition-colors text-xs">✎</button>
                      <button onClick={async () => { await window.api.deleteTodo(t.id); load() }}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {visible.length === 0 && (
        <div className="alpine-card p-8 text-center text-muted-foreground text-sm">
          <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          Keine Aufgaben.
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }}
        title={editing?.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Titel *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={editing.titel ?? ''}
                onChange={e => setEditing(p => ({ ...p, titel: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Beschreibung</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={2}
                value={editing.beschreibung ?? ''}
                onChange={e => setEditing(p => ({ ...p, beschreibung: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priorität</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.prioritaet ?? 'mittel'}
                  onChange={e => setEditing(p => ({ ...p, prioritaet: e.target.value as TodoPrioritaet }))}>
                  <option value="hoch">Hoch</option>
                  <option value="mittel">Mittel</option>
                  <option value="tief">Tief</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.status ?? 'offen'}
                  onChange={e => setEditing(p => ({ ...p, status: e.target.value as TodoStatus }))}>
                  <option value="offen">Offen</option>
                  <option value="in_arbeit">In Arbeit</option>
                  <option value="erledigt">Erledigt</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fällig am</label>
                <input type="date" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editing.faellig_am ?? ''}
                  onChange={e => setEditing(p => ({ ...p, faellig_am: e.target.value || undefined }))} />
              </div>
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
