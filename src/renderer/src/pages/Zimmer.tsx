import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Zimmer, ZimmerBelegung } from '../types'
import { BedDouble, Plus, Trash2, Pencil, AlertCircle } from 'lucide-react'
import Modal, { ConfirmModal } from '../components/UI/Modal'
import { DatePicker } from '../components/UI/DatePicker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/UI/Select'
import { cn, formatDate, todayISO } from '../lib/utils'
import { toast } from 'sonner'

const inputClass = "w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-alpine-400 focus:border-alpine-400 transition-all placeholder:text-muted-foreground/30"

export default function ZimmerPage() {
  const activeSaison = useActiveSaison()
  const [zimmer, setZimmer] = useState<Zimmer[]>([])
  const [belegungen, setBelegungen] = useState<ZimmerBelegung[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<ZimmerBelegung> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ZimmerBelegung | null>(null)
  const [deleteWithEinnahme, setDeleteWithEinnahme] = useState(true)

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
    
    // Validate Dates
    if (editing.datum_von && editing.datum_bis) {
      if (editing.datum_von >= editing.datum_bis) {
        toast.error('Ungültiger Zeitraum', { description: 'Das Enddatum muss nach dem Startdatum liegen (mindestens 1 Nacht).' })
        return
      }
    }

    // Validate capacity
    const selectedZimmer = zimmer.find(z => z.id === editing.zimmer_id)
    if (selectedZimmer && (editing.betten || 1) > selectedZimmer.kapazitaet) {
      toast.error('Kapazität überschritten', { description: `Dieses Zimmer hat nur ${selectedZimmer.kapazitaet} Betten.` })
      return
    }

    try {
      await window.api.saveZimmerBelegung({ ...editing, betten: editing.betten || 1, saison_id: activeSaison.id } as any)
      setModal(false)
      setEditing(null)
      await load()
      toast.success('Buchung gespeichert', { description: editing.id ? 'Änderungen wurden übernommen.' : 'Die neue Buchung wurde angelegt.' })
    } catch (e) {
      toast.error('Fehler beim Speichern')
    }
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
          <h1 className="page-title">Zimmerbelegung</h1>
          <p className="text-sm text-muted-foreground mt-1">Gästezimmer & Hüttenwartszimmer verwalten</p>
        </div>
        <button 
          onClick={() => { 
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            const toIso = (d: Date) => d.toISOString().split('T')[0];
            
            setEditing({ 
              datum_von: toIso(today), 
              datum_bis: toIso(tomorrow), 
              typ: 'gast' 
            }); 
            setModal(true) 
          }} 
          className="btn-primary focus:outline-none"
        >
          <Plus className="w-4 h-4" /> Buchung erfassen
        </button>
      </div>

      {/* Zimmer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zimmer.map(z => {
          const today = todayISO()
          const count = belegungen
            .filter(b => b.zimmer_id === z.id && b.datum_von <= today && b.datum_bis >= today)
            .reduce((sum, b) => sum + (b.betten || 0), 0)
          return (
            <div key={z.id} className="alpine-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-alpine-400/10 text-alpine-400">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground leading-tight">{z.name}</p>
                  <p className="text-xs text-muted-foreground">{z.typ} · {z.kapazitaet} Betten</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase font-medium">Aktuell belegt</p>
                <p className="text-lg font-display font-bold text-foreground">{count} / {z.kapazitaet}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Belegungsliste */}
      <div className="alpine-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Laden…</div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-forest-800 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Von</th>
                <th className="px-4 py-3 font-medium">Bis</th>
                <th className="px-4 py-3 font-medium">Zimmer</th>
                <th className="px-4 py-3 font-medium">Betten</th>
                <th className="px-4 py-3 font-medium">Gast / Helfer</th>
                <th className="px-4 py-3 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {belegungen.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">Keine Buchungen vorhanden</td></tr>
              )}
              {belegungen.map(b => (
                <tr key={b.id} className="hover:bg-forest-800/30 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(b.datum_von)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(b.datum_bis)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{b.zimmer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-medium">{b.betten || 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-foreground">{b.gast_name}</span>
                    <span className={cn('ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded border',
                      b.typ === 'helfer' ? 'bg-alpine-400/10 text-alpine-400 border-alpine-400/20' : 'bg-forest-700 text-muted-foreground border-border'
                    )}>
                      {b.typ}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(b); setModal(true) }} className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setDeleteTarget(b); setDeleteWithEinnahme(!!b.einnahme_id) }} className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
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

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} title={editing?.id ? 'Buchung bearbeiten' : 'Neue Buchung'}>
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Zimmer *</label>
                <Select value={editing.zimmer_id?.toString() ?? ""} onValueChange={v => setEditing(p => ({ ...p, zimmer_id: Number(v) }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>{zimmer.map(z => <SelectItem key={z.id} value={z.id.toString()}>{z.name} ({z.typ})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Betten / Personen *</label>
                <input 
                  type="number" 
                  min={1} 
                  max={zimmer.find(z => z.id === editing.zimmer_id)?.kapazitaet || 10}
                  className={inputClass} 
                  value={editing.betten ?? 1} 
                  onChange={e => setEditing(p => ({ ...p, betten: Number(e.target.value) }))} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Von *" value={editing.datum_von} onChange={e => setEditing(p => ({ ...p, datum_von: e.target.value }))} />
              <DatePicker label="Bis *" value={editing.datum_bis} onChange={e => setEditing(p => ({ ...p, datum_bis: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Gast / Name *</label>
                <input className={inputClass} placeholder="Name eingeben" value={editing.gast_name ?? ''} onChange={e => setEditing(p => ({ ...p, gast_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Typ</label>
                <Select value={editing.typ ?? 'gast'} onValueChange={v => setEditing(p => ({ ...p, typ: v as any }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Typ wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gast">Gast</SelectItem>
                    <SelectItem value="helfer">Helfer</SelectItem>
                  </SelectContent>
                </Select>
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

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Buchung löschen"
        message={`Möchtest du die Buchung für "${deleteTarget?.gast_name}" wirklich löschen?`}
        confirmLabel="Löschen"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await (window.api as any).deleteZimmerBelegung(deleteTarget.id, deleteWithEinnahme)
            await load()
            toast.success('Buchung gelöscht')
          } catch (e) {
            toast.error('Fehler beim Löschen')
          }
        }}
      >
        {!!deleteTarget?.einnahme_id && (
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-red-900/10 rounded border border-red-900/20 mt-2">
            <input 
              type="checkbox" 
              className="accent-red-600 w-4 h-4" 
              checked={deleteWithEinnahme} 
              onChange={e => setDeleteWithEinnahme(e.target.checked)} 
            />
            <div className="text-sm">
              <p className="font-medium text-red-200">Verknüpfte Einnahme ebenfalls löschen</p>
              <p className="text-xs text-red-200/60">Dies entfernt auch den entsprechenden Eintrag in der Buchhaltung.</p>
            </div>
          </label>
        )}
      </ConfirmModal>
    </div>
  )
}
