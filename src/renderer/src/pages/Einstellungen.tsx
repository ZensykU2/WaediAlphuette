import React, { useEffect, useState } from 'react'
import { 
  Plus, Trash2, Check, Mountain, Database, 
  ShieldCheck, Sliders, RefreshCw, Download, 
  Trash, Info, Save
} from 'lucide-react'
import { useSaisonStore, useActiveSaison } from '../store/saisonStore'
import { ConfirmModal } from '../components/UI/Modal'
import { formatDate } from '../lib/utils'
import { toast } from 'sonner'
import type { Saison } from '../types'

const emptyForm = { name: 'Sommer', jahr: new Date().getFullYear(), start_datum: '', end_datum: '' }

export default function Einstellungen() {
  const { saisons, createSaison, updateSaison, setActive, deleteSaison } = useSaisonStore()
  const activeSaison = useActiveSaison()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Saison | null>(null)
  
  // App Settings
  const [toastPos, setToastPos] = useState<'top-right' | 'bottom-right'>('bottom-right')

  React.useEffect(() => {
    const loadSettings = async () => {
      const s = await window.api.getAppSettings()
      if (s.toast_position) setToastPos(s.toast_position as any)
    }
    loadSettings()
  }, [])

  const updateToastPos = async (pos: 'top-right' | 'bottom-right') => {
    setToastPos(pos)
    await window.api.setAppSetting('toast_position', pos)
    toast.success('Position gespeichert', { description: 'Die Toast-Position wurde aktualisiert.' })
  }

  const saveSaisonSettings = async (field: string, value: any) => {
    if (!activeSaison) return
    try {
      await updateSaison(activeSaison.id, { [field]: value })
      toast.success('Gespeichert')
    } catch (e) {
      toast.error('Fehler beim Speichern')
    }
  }

  const save = async () => {
    if (!form.name || !form.jahr) return
    setSaving(true)
    try {
      await createSaison({
        name: form.name,
        jahr: form.jahr,
        start_datum: form.start_datum || undefined,
        end_datum: form.end_datum || undefined
      })
      setForm(emptyForm)
      setShowForm(false)
      toast.success('Saison erstellt', { description: `${form.name} ${form.jahr} wurde erfolgreich angelegt.` })
    } catch (e) {
      toast.error('Fehler beim Erstellen')
    } finally {
      setSaving(false)
    }
  }

  const handleSetActive = async (id: number) => {
    try {
      await setActive(id)
      toast.success('Saison gewechselt', { description: 'Die aktive Saison wurde erfolgreich geändert.' })
    } catch (e) {
      toast.error('Fehler beim Aktivieren')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSaison(deleteTarget.id)
      toast.success('Saison gelöscht')
      setDeleteTarget(null)
    } catch (e) {
      toast.error('Fehler beim Löschen')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl pb-12">
      <div>
        <h1 className="page-title">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Konfiguration & Systemverwaltung</p>
      </div>

      {/* Saisons */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Mountain className="w-4 h-4 text-alpine-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Saison-Management</h2>
        </div>
        <div className="alpine-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-forest-800/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Vorhandene Saisons ({saisons.length})</span>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-alpine-400 text-forest-900 text-xs font-bold transition-all hover:bg-alpine-500 active:scale-95 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" /> Neue Saison
            </button>
          </div>

          {/* New Season Form */}
          {showForm && (
            <div className="px-5 py-5 border-b border-border bg-forest-800/40 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Saison-Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="z.B. Sommer"
                    className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Jahr *</label>
                  <input type="number" value={form.jahr} onChange={e => setForm(f => ({ ...f, jahr: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Startdatum</label>
                  <input type="date" value={form.start_datum} onChange={e => setForm(f => ({ ...f, start_datum: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Enddatum</label>
                  <input type="date" value={form.end_datum} onChange={e => setForm(f => ({ ...f, end_datum: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-xs font-semibold bg-forest-700 hover:bg-forest-600 text-foreground transition-colors focus:outline-none">Abbrechen</button>
                <button onClick={save} disabled={saving || !form.name}
                  className="px-4 py-2 rounded-md text-xs font-bold bg-alpine-400 hover:bg-alpine-500 text-forest-900 transition-colors disabled:opacity-50 focus:outline-none">
                  {saving ? 'Erstellen…' : 'Saison anlegen'}
                </button>
              </div>
            </div>
          )}

          {/* Season List */}
          {saisons.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground/50 text-sm italic">
              Keine Saisons gefunden.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {saisons.map(s => {
                const isActive = s.id === activeSaison?.id
                return (
                  <div key={s.id} className={`flex items-center justify-between px-5 py-4 transition-colors ${isActive ? 'bg-alpine-400/5' : 'hover:bg-forest-800/30'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${isActive ? 'bg-alpine-400/20 text-alpine-400 border border-alpine-400/30' : 'bg-forest-700 text-muted-foreground border border-border'}`}>
                        {s.jahr.toString().slice(-2)}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isActive ? 'text-alpine-400' : 'text-foreground'}`}>{s.name} {s.jahr}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.start_datum ? formatDate(s.start_datum) : '?'} – {s.end_datum ? formatDate(s.end_datum) : '?'}
                        </p>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-alpine-400 bg-alpine-400/10 px-2 py-0.5 rounded-full border border-alpine-400/20">
                          <Check className="w-3 h-3" /> Aktiv
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button onClick={() => handleSetActive(s.id)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-forest-700 hover:bg-forest-600 text-foreground transition-colors focus:outline-none">
                          Aktivieren
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(s)}
                        className="p-2 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors focus:outline-none">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System & Maintenance */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">System & Anzeige</h2>
          </div>
          <div className="alpine-card p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground block">Toast-Position</label>
              <div className="flex gap-2 p-1 bg-forest-900 rounded-md">
                <button 
                  onClick={() => updateToastPos('top-right')}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${toastPos === 'top-right' ? 'bg-alpine-400 text-forest-900' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Oben Rechts
                </button>
                <button 
                  onClick={() => updateToastPos('bottom-right')}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${toastPos === 'bottom-right' ? 'bg-alpine-400 text-forest-900' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Unten Rechts
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <button 
                onClick={() => toast.info('Wartung gestartet', { description: 'Datenbank wird optimiert...' })}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Datenbank optimieren (VACUUM)
              </button>
            </div>
          </div>
        </section>

        {/* Defaults per Season */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Standard-Werte ({activeSaison?.name})</h2>
          </div>
          <div className="alpine-card p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground block">Übernachtungspreis (CHF)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={activeSaison?.uebernachtung_preis || 35} 
                  onChange={e => updateSaison(activeSaison!.id, { uebernachtung_preis: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 rounded bg-forest-900 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-alpine-400" 
                />
                <button className="p-1.5 rounded bg-alpine-400/10 text-alpine-400"><Check className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground block">Kegelbahn Privat-Anteil (%)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  value={(activeSaison?.kegelbahn_split_privat || 0.18) * 100} 
                  onChange={e => updateSaison(activeSaison!.id, { kegelbahn_split_privat: Number(e.target.value) / 100 })}
                  className="w-full px-2 py-1.5 rounded bg-forest-900 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-alpine-400" 
                />
                <button className="p-1.5 rounded bg-alpine-400/10 text-alpine-400"><Check className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Aktuell: {(activeSaison?.kegelbahn_split_privat || 0.18) * 100}% Privat / {(1 - (activeSaison?.kegelbahn_split_privat || 0.18)) * 100}% Verein</p>
            </div>
          </div>
        </section>
      </div>

      {/* App Info */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Info className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">System-Informationen</h2>
        </div>
        <div className="alpine-card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-forest-800/40">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Version</p>
              <p className="text-sm font-bold text-foreground">v1.1.0</p>
            </div>
            <div className="p-3 rounded-lg bg-forest-800/40">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</p>
              <p className="text-sm font-bold text-green-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Online
              </p>
            </div>
            <div className="p-3 rounded-lg bg-forest-800/40">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Datenbank</p>
              <p className="text-sm font-bold text-foreground">SQLite 3</p>
            </div>
            <div className="p-3 rounded-lg bg-forest-800/40">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Speicherort</p>
              <p className="text-sm font-bold text-foreground">Lokal</p>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground/50 text-center uppercase tracking-widest font-medium">
            Wädi Alphütte Finanzverwaltung · Desktop App
          </p>
        </div>
      </section>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Saison löschen"
        message={`Möchtest du die Saison "${deleteTarget?.name} ${deleteTarget?.jahr}" wirklich löschen? Alle zugehörigen Daten werden unwiderruflich gelöscht.`}
        confirmLabel="Löschen"
        danger
      />
    </div>
  )
}
