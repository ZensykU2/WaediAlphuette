import { useEffect, useState } from 'react'
import type { Helfer, HelferEinsatz, Zimmer } from '../types'
import { Users, Plus, Trash2, Pencil, Calendar, BedDouble, AlertCircle } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { DatePicker } from '../components/UI/DatePicker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/UI/Select'
import { cn, formatDate, todayISO } from '../lib/utils'
import { useActiveSaison } from '../store/saisonStore'
import { toast } from 'sonner'

const inputClass = "w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-alpine-400 focus:border-alpine-400 transition-all placeholder:text-muted-foreground/30"

const AUFGABEN = ['Küche', 'Service', 'Bar', 'Kasse', 'Aufbau', 'Abbau', 'Allgemein']
const SCHICHTEN = ['Ganztag', 'Vormittag', 'Nachmittag', 'Abend']

export default function Personal() {
  const activeSaison = useActiveSaison()
  const [helfer, setHelfer] = useState<Helfer[]>([])
  const [einsaetze, setEinsaetze] = useState<HelferEinsatz[]>([])
  const [zimmer, setZimmer] = useState<Zimmer[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'einsaetze' | 'helfer'>('einsaetze')

  // Modals
  const [helferModal, setHelferModal] = useState(false)
  const [einsatzModal, setEinsatzModal] = useState(false)
  const [editingHelfer, setEditingHelfer] = useState<Partial<Helfer> | null>(null)
  const [editingEinsatz, setEditingEinsatz] = useState<Partial<HelferEinsatz> | null>(null)

  const load = async () => {
    setLoading(true)
    const [h, z] = await Promise.all([
      window.api.getAllHelfer(),
      window.api.getAllZimmer()
    ])
    setHelfer(h as Helfer[])
    setZimmer(z as Zimmer[])

    if (activeSaison) {
      const e = await window.api.getEinsaetze(activeSaison.id)
      setEinsaetze(e as HelferEinsatz[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const saveHelfer = async () => {
    if (!editingHelfer) return
    await window.api.saveHelfer(editingHelfer as any)
    setHelferModal(false); setEditingHelfer(null); load()
  }

  const saveEinsatz = async () => {
    if (!editingEinsatz || !activeSaison) return
    const payload = {
      ...editingEinsatz,
      saison_id: activeSaison.id,
      uebernachtung_von: editingEinsatz.uebernachtung_von || editingEinsatz.datum,
      uebernachtung_bis: editingEinsatz.uebernachtung_bis || editingEinsatz.datum
    }

    if (payload.uebernachtung && !payload.zimmer_id) {
      toast.error('Zimmer fehlt', { description: 'Bitte ein Zimmer für die Übernachtung auswählen.' })
      return
    }

    if (payload.uebernachtung && payload.uebernachtung_von && payload.uebernachtung_bis) {
      if (payload.uebernachtung_von >= payload.uebernachtung_bis) {
        toast.error('Ungültiger Zeitraum', { description: 'Das Enddatum der Übernachtung muss nach dem Startdatum liegen.' })
        return
      }
    }

    await window.api.saveEinsatz(payload as any)
    setEinsatzModal(false)
    setEditingEinsatz(null)
    await load()
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
          <h1 className="page-title">Personal & Planung</h1>
          <p className="text-sm text-muted-foreground mt-1">Hilfspersonal und Einsatzplanung</p>
        </div>
        <button
          onClick={() => {
            if (tab === 'einsaetze') { 
              const today = new Date();
              const tomorrow = new Date();
              tomorrow.setDate(today.getDate() + 1);
              const toIso = (d: Date) => d.toISOString().split('T')[0];

              setEditingEinsatz({ 
                datum: toIso(today), 
                uebernachtung: 0,
                uebernachtung_von: toIso(today),
                uebernachtung_bis: toIso(tomorrow)
              }); 
              setEinsatzModal(true) 
            }
            else { setEditingHelfer({}); setHelferModal(true) }
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          {tab === 'einsaetze' ? 'Einsatz erfassen' : 'Helfer erfassen'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-forest-800 rounded-lg p-1 w-fit">
        {(['einsaetze', 'helfer'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === t ? 'bg-alpine-400/20 text-alpine-400' : 'text-muted-foreground hover:text-foreground'
            )}>
            {t === 'einsaetze' ? 'Einsatzplan' : 'Helfer'}
          </button>
        ))}
      </div>

      {tab === 'einsaetze' ? (
        <div className="alpine-card overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-forest-800 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Aufgabe / Schicht</th>
                <th className="px-4 py-3 font-medium">Übernachtung</th>
                <th className="px-4 py-3 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {einsaetze.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">Keine Einsätze geplant</td></tr>
              )}
              {einsaetze.map(e => (
                <tr key={e.id} className="hover:bg-forest-800/30 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.datum)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.helfer_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-foreground">{e.aufgabe}</span>
                    {e.schicht && <span className="text-muted-foreground ml-2">({e.schicht})</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.uebernachtung ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-alpine-400/10 text-alpine-400 text-xs border border-alpine-400/20">
                        <BedDouble className="w-3 h-3" /> {e.zimmer_name || 'Hütte'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingEinsatz(e); setEinsatzModal(true) }} className="p-1 hover:bg-forest-700 rounded text-muted-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { await window.api.deleteEinsatz(e.id); load() }} className="p-1 hover:bg-red-900/40 rounded text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {helfer.length === 0 && (
            <div className="col-span-full alpine-card p-8 text-center text-muted-foreground text-sm italic">Keine Helfer erfasst</div>
          )}
          {helfer.map(h => (
            <div key={h.id} className="alpine-card p-4 flex justify-between items-start group">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{h.name}</p>
                {(h.telefon || h.email) && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {[h.telefon, h.email].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingHelfer(h); setHelferModal(true) }} className="p-1.5 hover:bg-forest-700 rounded text-muted-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={async () => { await window.api.deleteHelfer(h.id); load() }} className="p-1.5 hover:bg-red-900/40 rounded text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: HELFER */}
      <Modal open={helferModal} onClose={() => setHelferModal(false)} title={editingHelfer?.id ? 'Helfer bearbeiten' : 'Neuer Helfer'}>
        {editingHelfer && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Name *</label>
              <input className={inputClass} value={editingHelfer.name ?? ''} onChange={e => setEditingHelfer(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Telefon</label>
                <input className={inputClass} value={editingHelfer.telefon ?? ''} onChange={e => setEditingHelfer(p => ({ ...p, telefon: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Email</label>
                <input className={inputClass} value={editingHelfer.email ?? ''} onChange={e => setEditingHelfer(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Notiz</label>
              <textarea className={cn(inputClass, "resize-none")} rows={2} value={editingHelfer.notiz ?? ''} onChange={e => setEditingHelfer(p => ({ ...p, notiz: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button onClick={() => setHelferModal(false)} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={saveHelfer} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: EINSATZ */}
      <Modal open={einsatzModal} onClose={() => setEinsatzModal(false)} title={editingEinsatz?.id ? 'Einsatz bearbeiten' : 'Neuer Einsatz'}>
        {editingEinsatz && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Helfer *</label>
                <Select value={editingEinsatz.helfer_id?.toString()} onValueChange={v => setEditingEinsatz(p => ({ ...p, helfer_id: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>{helfer.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DatePicker label="Datum *" value={editingEinsatz.datum} onChange={e => setEditingEinsatz(p => ({ ...p, datum: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Aufgabe *</label>
                <Select value={editingEinsatz.aufgabe} onValueChange={v => setEditingEinsatz(p => ({ ...p, aufgabe: v }))}>
                  <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>{AUFGABEN.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Schicht</label>
                <Select value={editingEinsatz.schicht || "—"} onValueChange={v => setEditingEinsatz(p => ({ ...p, schicht: v === "—" ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="—">—</SelectItem>
                    {SCHICHTEN.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input type="checkbox" className="accent-alpine-400 w-4 h-4" checked={!!editingEinsatz.uebernachtung} onChange={e => setEditingEinsatz(p => ({ ...p, uebernachtung: e.target.checked ? 1 : 0 }))} />
                <span className="text-sm text-foreground">Übernachtung</span>
              </label>
              {editingEinsatz.uebernachtung ? (
                <div className="flex-1 space-y-3 p-3 bg-forest-800/50 rounded-lg border border-border/40">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Zimmer</label>
                      <Select value={editingEinsatz.zimmer_id?.toString() || ""} onValueChange={v => setEditingEinsatz(p => ({ ...p, zimmer_id: Number(v) }))}>
                      <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                      <SelectContent>{zimmer.map(z => <SelectItem key={z.id} value={z.id.toString()}>{z.name} ({z.typ})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker label="Übernachtung Von" value={editingEinsatz.uebernachtung_von || editingEinsatz.datum} onChange={e => setEditingEinsatz(p => ({ ...p, uebernachtung_von: e.target.value }))} />
                    <DatePicker label="Übernachtung Bis" value={editingEinsatz.uebernachtung_bis || editingEinsatz.datum} onChange={e => setEditingEinsatz(p => ({ ...p, uebernachtung_bis: e.target.value }))} />
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Notiz</label>
              <textarea className={cn(inputClass, "resize-none")} rows={2} value={editingEinsatz.notiz ?? ''} onChange={e => setEditingEinsatz(p => ({ ...p, notiz: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button onClick={() => setEinsatzModal(false)} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={saveEinsatz} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
