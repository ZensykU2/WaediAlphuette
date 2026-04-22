import { useState } from 'react'
import { Plus, Trash2, Check, Mountain, Database } from 'lucide-react'
import { useSaisonStore, useActiveSaison } from '../store/saisonStore'
import { ConfirmModal } from '../components/UI/Modal'
import { formatDate } from '../lib/utils'
import type { Saison } from '../types'

const emptyForm = { name: 'Sommer', jahr: new Date().getFullYear(), start_datum: '', end_datum: '' }

export default function Einstellungen() {
  const { saisons, createSaison, setActive, deleteSaison } = useSaisonStore()
  const activeSaison = useActiveSaison()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Saison | null>(null)

  const save = async () => {
    if (!form.name || !form.jahr) return
    setSaving(true)
    await createSaison({
      name: form.name,
      jahr: form.jahr,
      start_datum: form.start_datum || undefined,
      end_datum: form.end_datum || undefined
    })
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Saisons verwalten</p>
      </div>

      {/* Saisons */}
      <div className="alpine-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-alpine-400" />
            <h2 className="font-semibold text-foreground">Saisons</h2>
            <span className="text-xs text-muted-foreground bg-forest-700 px-2 py-0.5 rounded-full">{saisons.length}</span>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-alpine-400/15 hover:bg-alpine-400/25 text-alpine-400 text-sm font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Neue Saison
          </button>
        </div>

        {/* New Season Form */}
        {showForm && (
          <div className="px-5 py-4 border-b border-border bg-forest-800/40 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Sommer"
                  className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Jahr</label>
                <input type="number" value={form.jahr} onChange={e => setForm(f => ({ ...f, jahr: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Start (optional)</label>
                <input type="date" value={form.start_datum} onChange={e => setForm(f => ({ ...f, start_datum: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Ende (optional)</label>
                <input type="date" value={form.end_datum} onChange={e => setForm(f => ({ ...f, end_datum: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm bg-forest-700 hover:bg-forest-600 text-foreground transition-colors">Abbrechen</button>
              <button onClick={save} disabled={saving || !form.name}
                className="px-4 py-2 rounded-md text-sm font-medium bg-alpine-400 hover:bg-alpine-500 text-forest-900 transition-colors disabled:opacity-50">
                {saving ? 'Erstellen…' : 'Saison erstellen'}
              </button>
            </div>
          </div>
        )}

        {/* Season List */}
        {saisons.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground text-sm">
            Noch keine Saisons. Erstelle deine erste Saison oben.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {saisons.map(s => {
              const isActive = s.id === activeSaison?.id
              return (
                <div key={s.id} className={`flex items-center justify-between px-5 py-4 transition-colors ${isActive ? 'bg-alpine-400/5' : 'hover:bg-forest-800/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-alpine-400/20 text-alpine-400' : 'bg-forest-700 text-muted-foreground'}`}>
                      {s.jahr.toString().slice(-2)}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isActive ? 'text-alpine-400' : 'text-foreground'}`}>{s.name} {s.jahr}</p>
                      {(s.start_datum || s.end_datum) && (
                        <p className="text-xs text-muted-foreground">
                          {s.start_datum ? formatDate(s.start_datum) : '?'} – {s.end_datum ? formatDate(s.end_datum) : '?'}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-xs text-alpine-400 bg-alpine-400/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Aktiv
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button onClick={() => setActive(s.id)}
                        className="px-3 py-1.5 rounded-md text-xs bg-forest-700 hover:bg-forest-600 text-foreground transition-colors">
                        Aktivieren
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(s)}
                      className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="alpine-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">App Info</h2>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Version: <span className="text-foreground">1.0.0</span></p>
          <p>Modus: <span className="text-foreground">Offline</span></p>
          <p>Datenbank: <span className="text-foreground">Lokal (SQLite)</span></p>
          <p className="pt-2 text-[10px] text-muted-foreground/50">Wädi Alphütte Finanzverwaltung · Alle Daten werden lokal gespeichert.</p>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await deleteSaison(deleteTarget.id); setDeleteTarget(null) } }}
        title="Saison löschen"
        message={`Möchtest du die Saison "${deleteTarget?.name} ${deleteTarget?.jahr}" wirklich löschen? Alle zugehörigen Daten werden unwiderruflich gelöscht.`}
        confirmLabel="Löschen"
        danger
      />
    </div>
  )
}
