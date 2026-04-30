import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Helfer, HelferEinsatz, Zimmer } from '../types'
import { formatDate, todayISO } from '../lib/utils'
import { Plus, Trash2, Pencil, BedDouble, AlertCircle } from 'lucide-react'
import Modal from '../components/UI/Modal'
import { cn } from '../lib/utils'

const AUFGABEN = ['Küche', 'Service', 'Bar', 'Kasse', 'Aufbau', 'Abbau', 'Allgemein']
const SCHICHTEN = ['Ganztag', 'Vormittag', 'Nachmittag', 'Abend']

export default function Personal() {
  const activeSaison = useActiveSaison()
  const [helfer, setHelfer] = useState<Helfer[]>([])
  const [einsaetze, setEinsaetze] = useState<HelferEinsatz[]>([])
  const [zimmer, setZimmer] = useState<Zimmer[]>([])
  const [tab, setTab] = useState<'einsaetze' | 'helfer'>('einsaetze')
  const [loading, setLoading] = useState(false)
  const [einsatzModal, setEinsatzModal] = useState(false)
  const [helferModal, setHelferModal] = useState(false)
  const [editingEinsatz, setEditingEinsatz] = useState<Partial<HelferEinsatz> | null>(null)
  const [editingHelfer, setEditingHelfer] = useState<Partial<Helfer> | null>(null)

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const [h, e, z] = await Promise.all([
      window.api.getAllHelfer(),
      window.api.getEinsaetze(activeSaison.id),
      window.api.getAllZimmer(),
    ])
    setHelfer(h as Helfer[])
    setEinsaetze(e as HelferEinsatz[])
    setZimmer(z as Zimmer[])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const saveEinsatz = async () => {
    if (!editingEinsatz || !activeSaison) return
    await window.api.saveEinsatz({ ...editingEinsatz, saison_id: activeSaison.id } as any)
    setEinsatzModal(false)
    setEditingEinsatz(null)
    load()
  }

  const saveHelfer = async () => {
    if (!editingHelfer) return
    await window.api.saveHelfer(editingHelfer as any)
    setHelferModal(false)
    setEditingHelfer(null)
    load()
  }

  if (!activeSaison) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-lg font-display font-semibold">Keine Saison aktiv</p>
        <p className="text-sm text-muted-foreground">Bitte erstelle zuerst eine Saison unter Einstellungen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Hilfspersonal</h1>
          <p className="text-sm text-muted-foreground mt-1">Einsatzplanung & Helferverwaltung</p>
        </div>
        <button
          onClick={() => {
            if (tab === 'einsaetze') { setEditingEinsatz({ datum: todayISO(), uebernachtung: 0 }); setEinsatzModal(true) }
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

      {/* Einsatzplan */}
      {tab === 'einsaetze' && (
        <div className="alpine-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Laden…</div>
          ) : einsaetze.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Noch keine Einsätze erfasst.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Datum</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Aufgabe</th>
                  <th className="px-4 py-3 text-left">Schicht</th>
                  <th className="px-4 py-3 text-left">Übernachtung</th>
                  <th className="px-4 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {einsaetze.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-forest-800/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(e.datum)}</td>
                    <td className="px-4 py-3 font-medium">{e.helfer_name}</td>
                    <td className="px-4 py-3">{e.aufgabe}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.schicht ?? '—'}</td>
                    <td className="px-4 py-3">
                      {e.uebernachtung ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-alpine-400/15 text-alpine-400 border border-alpine-400/30">
                          <BedDouble className="w-3 h-3" />
                          {e.zimmer_name ?? 'Zimmer'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingEinsatz(e); setEinsatzModal(true) }}
                          className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={async () => { await window.api.deleteEinsatz(e.id); load() }}
                          className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
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
      )}

      {/* Helfer list */}
      {tab === 'helfer' && (
        <div className="grid gap-3">
          {helfer.length === 0 && !loading && (
            <div className="alpine-card p-8 text-center text-muted-foreground text-sm">Noch keine Helfer erfasst.</div>
          )}
          {helfer.map(h => (
            <div key={h.id} className="alpine-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{h.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[h.telefon, h.email].filter(Boolean).join(' · ') || 'Keine Kontaktdaten'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingHelfer(h); setHelferModal(true) }}
                  className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={async () => { await window.api.deleteHelfer(h.id); load() }}
                  className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Einsatz Modal */}
      <Modal
        open={einsatzModal}
        onClose={() => { setEinsatzModal(false); setEditingEinsatz(null) }}
        title={editingEinsatz?.id ? 'Einsatz bearbeiten' : 'Neuer Einsatz'}
      >
        {editingEinsatz && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Helfer *</label>
                <select
                  className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editingEinsatz.helfer_id ?? ''}
                  onChange={e => setEditingEinsatz(prev => ({ ...prev, helfer_id: Number(e.target.value) }))}
                >
                  <option value="">Helfer wählen…</option>
                  {helfer.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Datum *</label>
                <input type="date" className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editingEinsatz.datum ?? todayISO()}
                  onChange={e => setEditingEinsatz(prev => ({ ...prev, datum: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Aufgabe *</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editingEinsatz.aufgabe ?? ''}
                  onChange={e => setEditingEinsatz(prev => ({ ...prev, aufgabe: e.target.value }))}>
                  <option value="">Wählen…</option>
                  {AUFGABEN.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Schicht</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editingEinsatz.schicht ?? ''}
                  onChange={e => setEditingEinsatz(prev => ({ ...prev, schicht: e.target.value || undefined }))}>
                  <option value="">—</option>
                  {SCHICHTEN.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-alpine-400 w-4 h-4"
                  checked={!!editingEinsatz.uebernachtung}
                  onChange={e => setEditingEinsatz(prev => ({ ...prev, uebernachtung: e.target.checked ? 1 : 0 }))} />
                <span className="text-sm">Übernachtung</span>
              </label>
            </div>
            {editingEinsatz.uebernachtung ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zimmer</label>
                <select className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={editingEinsatz.zimmer_id ?? ''}
                  onChange={e => setEditingEinsatz(prev => ({ ...prev, zimmer_id: e.target.value ? Number(e.target.value) : undefined }))}>
                  <option value="">Kein Zimmer</option>
                  {zimmer.map(z => <option key={z.id} value={z.id}>{z.name} ({z.typ}, {z.kapazitaet} Plätze)</option>)}
                </select>
              </div>
            ) : null}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notiz</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={2}
                value={editingEinsatz.notiz ?? ''}
                onChange={e => setEditingEinsatz(prev => ({ ...prev, notiz: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setEinsatzModal(false); setEditingEinsatz(null) }} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={saveEinsatz} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Helfer Modal */}
      <Modal
        open={helferModal}
        onClose={() => { setHelferModal(false); setEditingHelfer(null) }}
        title={editingHelfer?.id ? 'Helfer bearbeiten' : 'Neuer Helfer'}
      >
        {editingHelfer && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                placeholder="Vorname Nachname"
                value={editingHelfer.name ?? ''}
                onChange={e => setEditingHelfer(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
                <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  placeholder="+41 79 …"
                  value={editingHelfer.telefon ?? ''}
                  onChange={e => setEditingHelfer(prev => ({ ...prev, telefon: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">E-Mail</label>
                <input className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  placeholder="name@example.com"
                  value={editingHelfer.email ?? ''}
                  onChange={e => setEditingHelfer(prev => ({ ...prev, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notiz</label>
              <textarea className="w-full bg-forest-800 border border-border rounded-md px-3 py-2 text-sm text-foreground resize-none" rows={2}
                value={editingHelfer.notiz ?? ''}
                onChange={e => setEditingHelfer(prev => ({ ...prev, notiz: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setHelferModal(false); setEditingHelfer(null) }} className="btn-secondary text-sm">Abbrechen</button>
              <button onClick={saveHelfer} className="btn-primary text-sm">Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
