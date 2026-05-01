import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Einkaufsitem, EinkaufKategorie } from '../types'
import { Plus, Trash2, AlertCircle, Check, ShoppingCart, Pencil, ShoppingBasket, CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import Modal, { ConfirmModal } from '../components/UI/Modal'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/UI/Select'
import { cn } from '../lib/utils'
import { toast } from 'sonner'

const inputClass = "w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-alpine-400 focus:border-alpine-400 transition-all placeholder:text-muted-foreground/30"

const KATEGORIEN: { value: EinkaufKategorie; label: string; color: string }[] = [
  { value: 'lebensmittel', label: 'Lebensmittel', color: 'bg-green-900/40 text-green-300 border-green-700/40' },
  { value: 'getraenke',    label: 'Getränke',      color: 'bg-blue-900/40 text-blue-300 border-blue-700/40' },
  { value: 'material',     label: 'Material',      color: 'bg-purple-900/40 text-purple-300 border-purple-700/40' },
  { value: 'sonstiges',    label: 'Sonstiges',     color: 'bg-stone-700/60 text-stone-300 border-stone-600/40' },
]

export default function Einkauf() {
  const activeSaison = useActiveSaison()
  const [items, setItems] = useState<Einkaufsitem[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Einkaufsitem> | null>(null)
  const [filterKat, setFilterKat] = useState<EinkaufKategorie | 'alle'>('alle')
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

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
    try {
      await window.api.saveEinkaufsitem({ ...editing, saison_id: activeSaison.id } as any)
      setModal(false); setEditing(null); load()
      toast.success('Einkaufsliste aktualisiert')
    } catch (e) {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleBulkDelete = async () => {
    if (!activeSaison) return
    try {
      await window.api.deleteCheckedEinkauf(activeSaison.id)
      load()
      toast.success('Erledigte Artikel gelöscht')
      setShowBulkConfirm(false)
    } catch (e) {
      toast.error('Fehler beim Löschen')
    }
  }

  const toggle = async (id: number) => {
    await window.api.toggleEinkaufsitemBesorgt(id)
    load()
  }

  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncFoodAmount, setSyncFoodAmount] = useState<string>('')
  const [syncDrinksAmount, setSyncDrinksAmount] = useState<string>('')

  const checkedItems = items.filter(i => i.besorgt)
  const hasFood = checkedItems.some(i => i.kategorie === 'lebensmittel' || i.kategorie === 'sonstiges')
  const hasDrinks = checkedItems.some(i => i.kategorie === 'getraenke')

  const handleSync = async () => {
    if (!activeSaison) return
    try {
      const data = {
        foodAmount: syncFoodAmount ? Number(syncFoodAmount) : 0,
        drinksAmount: syncDrinksAmount ? Number(syncDrinksAmount) : 0
      }
      const count = await window.api.syncEinkaufToAusgaben(activeSaison.id, data)
      toast.success('Synchronisiert', { description: `${count} Artikel wurden als Ausgaben erfasst.` })
      setShowSyncModal(false)
      setSyncFoodAmount('')
      setSyncDrinksAmount('')
    } catch (e) {
      toast.error('Fehler bei Synchronisation')
    }
  }

  const visible = filterKat === 'alle' ? items : items.filter(i => i.kategorie === filterKat)
  const hasChecked = items.some(i => i.besorgt)

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
          <p className="text-sm text-muted-foreground mt-1">Zutaten und Material verwalten</p>
        </div>
        <div className="flex gap-2">
          {hasChecked && (
            <>
              <button 
                onClick={() => setShowSyncModal(true)}
                className="btn-secondary text-alpine-400 border-alpine-900/30 hover:bg-alpine-900/20 focus:outline-none flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Zu Ausgaben synchronisieren
              </button>
              <button onClick={() => setShowBulkConfirm(true)} className="btn-secondary text-red-400 hover:text-red-300 border-red-900/30 hover:bg-red-900/20 focus:outline-none">
                <Trash2 className="w-4 h-4" /> Erledigte löschen
              </button>
            </>
          )}
          <button onClick={() => { setEditing({ kategorie: 'lebensmittel', besorgt: 0 }); setModal(true) }} className="btn-primary focus:outline-none">
            <Plus className="w-4 h-4" /> Artikel hinzufügen
          </button>
        </div>
      </div>

      <Modal open={showSyncModal} onClose={() => setShowSyncModal(false)} title="Zu Ausgaben synchronisieren">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gib den Betrag für die erledigten Artikel ein.
          </p>
          
          {hasFood && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Lebensmittel / Sonstiges (Privat) (CHF)</label>
              <input 
                type="number" 
                step="0.05"
                className={inputClass} 
                placeholder="0.00"
                value={syncFoodAmount}
                onChange={e => setSyncFoodAmount(e.target.value)}
                autoFocus={!hasDrinks}
              />
            </div>
          )}

          {hasDrinks && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Getränke (Verein) (CHF)</label>
              <input 
                type="number" 
                step="0.05"
                className={inputClass} 
                placeholder="0.00"
                value={syncDrinksAmount}
                onChange={e => setSyncDrinksAmount(e.target.value)}
                autoFocus={hasDrinks}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <button onClick={() => setShowSyncModal(false)} className="btn-secondary text-sm">Abbrechen</button>
            <button 
              onClick={handleSync} 
              disabled={(!hasFood || !syncFoodAmount) && (!hasDrinks || !syncDrinksAmount)} 
              className="btn-primary text-sm"
            >
              Synchronisieren
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal 
        open={showBulkConfirm} 
        onClose={() => setShowBulkConfirm(false)} 
        onConfirm={handleBulkDelete}
        title="Erledigte löschen"
        message="Sollen wirklich alle als 'besorgt' markierten Artikel gelöscht werden?"
      />

      {/* Category filter */}
      <div className="flex gap-1 bg-forest-800 rounded-lg p-1 w-fit">
        <button onClick={() => setFilterKat('alle')}
          className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
            filterKat === 'alle' ? 'bg-alpine-400/20 text-alpine-400' : 'text-muted-foreground hover:text-foreground')}>
          Alle ({items.length})
        </button>
        {KATEGORIEN.map(k => {
          const count = items.filter(i => i.kategorie === k.value).length
          return (
            <button key={k.value} onClick={() => setFilterKat(k.value)}
              className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                filterKat === k.value ? 'bg-alpine-400/20 text-alpine-400' : 'text-muted-foreground hover:text-foreground')}>
              {k.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {loading && <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Laden…</div>}
        {!loading && visible.length === 0 && (
          <div className="alpine-card p-12 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm italic">Keine Artikel in dieser Kategorie.</p>
          </div>
        )}
        {!loading && visible.map((item) => {
          const kat = KATEGORIEN.find(k => k.value === item.kategorie)
          return (
            <div key={item.id} className={cn(
              "alpine-card p-4 flex items-center justify-between group transition-all",
              item.besorgt && "opacity-50 grayscale-[0.5]"
            )}>
              <div className="flex items-center gap-4 min-w-0">
                <button onClick={() => toggle(item.id)}
                  className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    item.besorgt ? "bg-alpine-400 border-alpine-400 text-forest-900" : "border-border hover:border-alpine-400"
                  )}>
                  {item.besorgt ? <Check className="w-4 h-4" /> : null}
                </button>
                <div className="min-w-0">
                  <p className={cn("font-medium text-foreground truncate", item.besorgt && "line-through")}>
                    {item.artikel}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border", kat?.color)}>
                      {kat?.label}
                    </span>
                    {item.menge && (
                      <span className="text-xs text-muted-foreground">
                        {item.menge} {item.einheit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(item); setModal(true) }} className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={async () => { 
                  try {
                    await window.api.deleteEinkaufsitem(item.id); 
                    load();
                    toast.success('Artikel entfernt');
                  } catch (e) {
                    toast.error('Fehler beim Löschen');
                  }
                }} className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} title={editing?.id ? 'Artikel bearbeiten' : 'Artikel hinzufügen'}>
        {editing && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Kategorie</label>
              <Select value={editing.kategorie} onValueChange={v => setEditing(p => ({ ...p, kategorie: v as any }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {KATEGORIEN.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Artikel *</label>
              <input className={inputClass} placeholder="z.B. Mehl, Butter, etc." value={editing.artikel ?? ''} onChange={e => setEditing(p => ({ ...p, artikel: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Menge</label>
                <input type="number" step="0.1" className={inputClass} value={editing.menge ?? ''} onChange={e => setEditing(p => ({ ...p, menge: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Einheit</label>
                <input className={inputClass} placeholder="kg, Stk, etc." value={editing.einheit ?? ''} onChange={e => setEditing(p => ({ ...p, einheit: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Notiz</label>
              <textarea className={cn(inputClass, "resize-none")} rows={2} value={editing.notiz ?? ''} onChange={e => setEditing(p => ({ ...p, notiz: e.target.value }))} />
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
