import { useEffect, useState, DragEvent } from 'react'
import type { Todo, TodoPrioritaet, TodoStatus } from '../types'
import { CheckSquare, Plus, Trash2, Pencil, Calendar, Grape, GripVertical } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { DatePicker } from '../components/UI/DatePicker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/UI/Select'
import { cn, formatDate, todayISO } from '../lib/utils'
import { toast } from 'sonner'
import { useActiveSaison } from '../store/saisonStore'

const inputClass = "w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-alpine-400 focus:border-alpine-400 transition-all placeholder:text-muted-foreground/30"

const PRIO_STYLES: Record<TodoPrioritaet, string> = {
  hoch:   'bg-red-900/40 text-red-300 border-red-700/40',
  mittel: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  tief:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
}

export default function Todos() {
  const activeSaison = useActiveSaison()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Todo> | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await window.api.getTodos(activeSaison?.id) as Todo[]
    setTodos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const save = async () => {
    if (!editing || !activeSaison) return
    try {
      await window.api.saveTodo({ ...editing, saison_id: activeSaison.id } as any)
      setModal(false); setEditing(null); load()
      toast.success('Aufgabe gespeichert')
    } catch (e) {
      toast.error('Fehler beim Speichern')
    }
  }

  const updateStatus = async (todoId: number, newStatus: TodoStatus) => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo || todo.status === newStatus) return
    await window.api.saveTodo({ ...todo, status: newStatus })
    load()
  }

  const cycleStatus = async (todo: Todo) => {
    const next: Record<TodoStatus, TodoStatus> = { offen: 'in_arbeit', in_arbeit: 'erledigt', erledigt: 'offen' }
    await window.api.saveTodo({ ...todo, status: next[todo.status] })
    load()
  }

  const handleDragStart = (e: DragEvent, id: number) => {
    setDraggingId(id)
    e.dataTransfer.setData('todoId', id.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: DragEvent, status: TodoStatus) => {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('todoId'))
    setDraggingId(null)
    if (id) await updateStatus(id, status)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">To-dos & Aufgaben</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {todos.filter(t => t.status !== 'erledigt').length} offene Aufgaben
          </p>
        </div>
        <button onClick={() => { setEditing({ prioritaet: 'mittel', status: 'offen' }); setModal(true) }} className="btn-primary focus:outline-none">
          <Plus className="w-4 h-4" /> To-do erfassen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['offen', 'in_arbeit', 'erledigt'] as TodoStatus[]).map(status => (
          <div key={status} className="space-y-4" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">
                {status === 'in_arbeit' ? 'In Arbeit' : status.charAt(0).toUpperCase() + status.slice(1)}
              </h3>
              <span className="text-xs font-mono text-muted-foreground/50">{todos.filter(t => t.status === status).length}</span>
            </div>
            <div className="space-y-3 min-h-[150px]">
              {todos.filter(t => t.status === status).map(t => (
                <div key={t.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={cn(
                    "alpine-card p-4 space-y-3 group transition-all cursor-grab active:cursor-grabbing",
                    draggingId === t.id ? "opacity-20 scale-95" : "hover:ring-1 hover:ring-alpine-400/30"
                  )}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button onClick={() => cycleStatus(t)} className="mt-1 shrink-0">
                        {t.status === 'erledigt' ? <CheckSquare className="w-5 h-5 text-alpine-400" /> : <div className="w-5 h-5 rounded border-2 border-border" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-semibold text-foreground truncate', t.status === 'erledigt' && 'line-through text-muted-foreground')}>
                          {t.titel}
                        </p>
                        {t.beschreibung && <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{t.beschreibung}</p>}
                      </div>
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/40 shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border', PRIO_STYLES[t.prioritaet])}>
                        {t.prioritaet}
                      </span>
                      {t.faellig_am && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" /> {formatDate(t.faellig_am)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(t); setModal(true) }} className="p-1 hover:bg-forest-700 rounded text-muted-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async (e) => { 
                        e.stopPropagation(); 
                        try {
                          await window.api.deleteTodo(t.id); 
                          load();
                          toast.success('Aufgabe gelöscht');
                        } catch (err) {
                          toast.error('Fehler beim Löschen');
                        }
                      }} className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {todos.filter(t => t.status === status).length === 0 && (
                <div className="flex flex-col items-center justify-center h-[120px] border-2 border-dashed border-border/20 rounded-xl text-muted-foreground/20 text-xs italic">
                  <div className="p-2 rounded-full bg-border/5 mb-2">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Keine Aufgaben</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} title={editing?.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Titel *</label>
              <input className={inputClass} value={editing.titel ?? ''} onChange={e => setEditing(p => ({ ...p, titel: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Priorität</label>
                <Select value={editing.prioritaet ?? 'mittel'} onValueChange={v => setEditing(p => ({ ...p, prioritaet: v as any }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoch">Hoch</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="tief">Tief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DatePicker label="Fällig am" value={editing.faellig_am} onChange={e => setEditing(p => ({ ...p, faellig_am: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Beschreibung</label>
              <textarea className={cn(inputClass, "resize-none")} rows={3} value={editing.beschreibung ?? ''} onChange={e => setEditing(p => ({ ...p, beschreibung: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-border/40 mt-6">
              <button onClick={() => { setModal(false); setEditing(null) }} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={save} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
